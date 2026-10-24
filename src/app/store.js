import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/authSlice';
import events from '../features/eventsSlice';
import ui, { storageFailed } from '../features/uiSlice';
import { KEYS, writeJSON } from '../utils/storage';
export const store = configureStore({reducer:{auth,ui,events},devTools:import.meta.env.DEV});
let previous = store.getState();
store.subscribe(()=>{
 const state=store.getState(); const old=previous; previous=state;
 if (old.auth.user!==state.auth.user && !writeJSON(KEYS.session,state.auth.user) && !state.ui.storageError) store.dispatch(storageFailed());
});
