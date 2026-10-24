import { KEYS, readJSON, writeJSON } from '../utils/storage';
const getUsers = () => { const users = readJSON(KEYS.users, []); return Array.isArray(users) ? users.filter(u => u?.id && u?.email && u?.hash && u?.salt) : []; };
const publicUser = ({id,name,email}) => ({id,name,email});
export function loadSession() { const session = readJSON(KEYS.session, null); const user = getUsers().find(u => u.id === session?.id); return user ? publicUser(user) : null; }
async function derive(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('Use localhost or HTTPS to access account features.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'}, key, 256);
  return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2,'0')).join('');
}
export async function authenticate({name,email,password}, registering) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  const users = getUsers();
  let user = users.find(u => u.email === normalizedEmail);
  if (registering) {
    if (!name?.trim() || name.trim().length < 2) throw new Error('Please enter your name (at least 2 characters).');
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
    if (user) throw new Error('An account with this email already exists. Please log in.');
    const salt = crypto.randomUUID();
    user = {id:crypto.randomUUID(), name:name.trim(), email:normalizedEmail, salt, hash:await derive(password,salt)};
    if (!writeJSON(KEYS.users, [...users,user])) throw new Error('Your browser could not save the account. Allow local storage and try again.');
  } else if (!user || await derive(password, user.salt) !== user.hash) throw new Error('Email or password is incorrect.');
  if (!writeJSON(KEYS.session, publicUser(user))) throw new Error('Your browser could not save the session. Allow local storage and try again.');
  return publicUser(user);
}
