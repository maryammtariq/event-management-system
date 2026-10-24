import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { searchEvents, getEvent } from "../services/ticketmaster";
export const fetchEvents = createAsyncThunk(
  "events/search",
  async ({ filters, page = 0 }, { signal, rejectWithValue }) => {
    try {
      return await searchEvents(filters, page, signal);
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);
export const fetchEvent = createAsyncThunk(
  "events/detail",
  async (id, { signal, rejectWithValue }) => {
    try {
      return await getEvent(id, signal);
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);
const initialState = {
  items: [],
  page: 0,
  total: 0,
  totalPages: 0,
  status: "idle",
  error: null,
  requestId: null,
  detail: null,
  detailStatus: "idle",
  detailError: null,
  detailRequestId: null,
};
const slice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (b) =>
    b
      .addCase(fetchEvents.pending, (s, a) => {
        s.status = "loading";
        s.error = null;
        s.requestId = a.meta.requestId;
      })
      .addCase(fetchEvents.fulfilled, (s, a) => {
        if (s.requestId !== a.meta.requestId) return;
        Object.assign(s, a.payload);
        s.status = "succeeded";
      })
      .addCase(fetchEvents.rejected, (s, a) => {
        if (s.requestId !== a.meta.requestId) return;
        s.status = a.meta.aborted ? "idle" : "failed";
        s.error = a.meta.aborted ? null : a.payload || "Unable to load events.";
      })
      .addCase(fetchEvent.pending, (s, a) => {
        s.detail = null;
        s.detailStatus = "loading";
        s.detailError = null;
        s.detailRequestId = a.meta.requestId;
      })
      .addCase(fetchEvent.fulfilled, (s, a) => {
        if (s.detailRequestId !== a.meta.requestId) return;
        s.detail = a.payload;
        s.detailStatus = "succeeded";
      })
      .addCase(fetchEvent.rejected, (s, a) => {
        if (s.detailRequestId !== a.meta.requestId) return;
        s.detailStatus = a.meta.aborted ? "idle" : "failed";
        s.detailError = a.meta.aborted
          ? null
          : a.payload || "Unable to load this event.";
      }),
});
export default slice.reducer;
