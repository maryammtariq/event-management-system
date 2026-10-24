import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/authSlice';
import registrations from '../features/registrationsSlice';
import events from '../features/eventsSlice';
import ui, { storageFailed } from '../features/uiSlice';
import { KEYS, writeJSON } from '../utils/storage';
export const store = configureStore({reducer:{auth,ui,events,registrations},devTools:import.meta.env.DEV});
let previous = store.getState();
store.subscribe(()=>{
 const state=store.getState(); const old=previous; previous=state;
 if(old.registrations!==state.registrations && !writeJSON(KEYS.registrations,state.registrations.byUser) && !state.ui.storageError) store.dispatch(storageFailed());
 if (old.auth.user!==state.auth.user && !writeJSON(KEYS.session,state.auth.user) && !state.ui.storageError) store.dispatch(storageFailed());
});
