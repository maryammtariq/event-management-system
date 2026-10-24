import { createSlice } from "@reduxjs/toolkit";
import { loadRegistrations } from "../utils/storage";
import { canRegister, isCompleted } from "../utils/events";
const slice = createSlice({
  name: "registrations",
  initialState: { byUser: loadRegistrations() },
  reducers: {
    registerEvent(state, { payload: { userId, event } }) {
      if (!userId || !event?.id || !canRegister(event)) return;
      const list = (state.byUser[userId] ||= []);
      if (!list.some((r) => r.event.id === event.id))
        list.push({ event, registeredAt: new Date().toISOString() });
    },
    cancelRegistration(state, { payload: { userId, eventId } }) {
      const list = state.byUser[userId] || [];
      state.byUser[userId] = list.filter(
        (r) => r.event.id !== eventId || isCompleted(r.event),
      );
    },
  },
});
export const { registerEvent, cancelRegistration } = slice.actions;
export const EMPTY_REGISTRATIONS = Object.freeze([]);
export const selectMyRegistrations = (state) =>
  state.registrations.byUser[state.auth.user?.id] || EMPTY_REGISTRATIONS;
export default slice.reducer;
