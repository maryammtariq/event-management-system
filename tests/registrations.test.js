import { describe, it, expect } from "vitest";
import reducer, {
  registerEvent,
  cancelRegistration,
} from "../src/features/registrationsSlice";
const event = {
  id: "e1",
  name: "Show",
  dateTime: "2099-01-01T00:00:00Z",
  status: "onsale",
};
const initial = () => ({ byUser: {} });
describe("registration rules", () => {
  it("prevents duplicates while keeping different accounts separate", () => {
    let state = reducer(initial(), registerEvent({ userId: "a", event }));
    state = reducer(state, registerEvent({ userId: "a", event }));
    expect(state.byUser.a).toHaveLength(1);
    expect(state.byUser.b).toBeUndefined();
    state = reducer(state, registerEvent({ userId: "b", event }));
    expect(state.byUser.b).toHaveLength(1);
  });
  it("cancels only the selected user registration", () => {
    let state = reducer(initial(), registerEvent({ userId: "a", event }));
    state = reducer(state, registerEvent({ userId: "b", event }));
    state = reducer(state, cancelRegistration({ userId: "a", eventId: "e1" }));
    expect(state.byUser.a).toHaveLength(0);
    expect(state.byUser.b).toHaveLength(1);
  });
  it("rejects past and cancelled events and preserves completed history", () => {
    const past = { ...event, dateTime: "2000-01-01T00:00:00Z" };
    expect(
      reducer(initial(), registerEvent({ userId: "a", event: past })).byUser.a,
    ).toBeUndefined();
    expect(
      reducer(
        initial(),
        registerEvent({
          userId: "a",
          event: { ...event, status: "cancelled" },
        }),
      ).byUser.a,
    ).toBeUndefined();
    const state = { byUser: { a: [{ event: past }] } };
    expect(
      reducer(state, cancelRegistration({ userId: "a", eventId: "e1" })).byUser
        .a,
    ).toHaveLength(1);
  });
});
