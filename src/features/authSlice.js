import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authenticate, loadSession } from '../services/auth';
export const submitAuth = createAsyncThunk('auth/submit', async ({registering, ...fields}, {rejectWithValue}) => {
  try { return await authenticate(fields, registering); } catch(e) { return rejectWithValue(e.message); }
});
const slice = createSlice({name:'auth', initialState:{user:loadSession(),status:'idle',error:null}, reducers:{
  logout(state) { state.user=null; state.error=null; }, clearAuthError(state) { state.error=null; }
}, extraReducers:builder => builder
 .addCase(submitAuth.pending,state=>{state.status='loading';state.error=null;})
 .addCase(submitAuth.fulfilled,(state,action)=>{state.user=action.payload;state.status='idle';})
 .addCase(submitAuth.rejected,(state,action)=>{state.error=action.payload || 'Please try again.';state.status='idle';})});
export const { logout, clearAuthError } = slice.actions;
export default slice.reducer;
