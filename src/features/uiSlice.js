import { createSlice } from "@reduxjs/toolkit";
const slice = createSlice({
  name: "ui",
  initialState: { notice: null, storageError: false },
  reducers: {
    notify(state, action) {
      state.notice = action.payload;
    },
    dismissNotice(state) {
      state.notice = null;
    },
    storageFailed(state) {
      state.storageError = true;
    },
  },
});
export const { notify, dismissNotice, storageFailed } = slice.actions;
export default slice.reducer;
