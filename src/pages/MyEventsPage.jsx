import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  Ticket,
} from "lucide-react";
import {
  cancelRegistration,
  selectMyRegistrations,
} from "../features/registrationsSlice";
import { notify } from "../features/uiSlice";
import { isCompleted } from "../utils/events";
import EventCard from "../components/EventCard";
import { EmptyState } from "../components/Feedback";
export default function MyEventsPage() {
  const [tab, setTab] = useState("upcoming"),
    dispatch = useDispatch(),
    user = useSelector((s) => s.auth.user),
    registrations = useSelector(selectMyRegistrations);
  const upcoming = registrations.filter((r) => !isCompleted(r.event)),
    completed = registrations.filter((r) => isCompleted(r.event)),
    items = tab === "upcoming" ? upcoming : completed;
  function cancel(event) {
    if (window.confirm(`Cancel your registration for ${event.name}?`)) {
      dispatch(cancelRegistration({ userId: user.id, eventId: event.id }));
      dispatch(notify("Your registration has been cancelled."));
    }
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">YOUR PLANS, ALL TOGETHER</span>
        <h1>
          A calendar <em>worth keeping.</em>
        </h1>
        <p>
          {user.name.split(" ")[0]}, here’s what you’ve got to look forward to.
        </p>
      </div>
      <div className="stats-grid">
        <div>
          <span className="stat-icon">
            <Ticket />
          </span>
          <span>
            <strong>{registrations.length}</strong>
            <small>Total registrations</small>
          </span>
        </div>
        <div>
          <span className="stat-icon">
            <CalendarDays />
          </span>
          <span>
            <strong>{upcoming.length}</strong>
            <small>Upcoming events</small>
          </span>
        </div>
        <div>
          <span className="stat-icon">
            <CalendarCheck />
          </span>
          <span>
            <strong>{completed.length}</strong>
            <small>Started / completed</small>
          </span>
        </div>
      </div>
      <div className="my-events-heading">
        <div className="my-tabs" aria-label="Registered event view">
          <button
            aria-pressed={tab === "upcoming"}
            className={tab === "upcoming" ? "active" : ""}
            onClick={() => setTab("upcoming")}
          >
            Upcoming <span>{upcoming.length}</span>
          </button>
          <button
            aria-pressed={tab === "completed"}
            className={tab === "completed" ? "active" : ""}
            onClick={() => setTab("completed")}
          >
            Completed <span>{completed.length}</span>
          </button>
        </div>
        <Link to="/events" className="text-link">
          Find more moments <ArrowUpRight size={16} />
        </Link>
      </div>
      {items.length ? (
        <div className="event-grid">
          {[...items]
            .sort(
              (a, b) =>
                (a.event.date || "9999").localeCompare(b.event.date || "9999") *
                (tab === "completed" ? -1 : 1),
            )
            .map(({ event }) => (
              <EventCard key={event.id} event={event} registered>
                {tab === "upcoming" && (
                  <button
                    className="cancel-button"
                    onClick={() => cancel(event)}
                  >
                    Cancel registration
                  </button>
                )}
              </EventCard>
            ))}
        </div>
      ) : (
        <EmptyState
          title={
            tab === "upcoming"
              ? "Your next memory is waiting."
              : "A little space for future memories."
          }
          text={
            tab === "upcoming"
              ? "Discover something you love and register to see it here."
              : "Events appear here after their scheduled start. Events without a confirmed date stay in Upcoming."
          }
          action={
            <Link className="button" to="/events">
              Discover events <ArrowUpRight size={16} />
            </Link>
          }
        />
      )}
      <p className="dashboard-note">
        Registrations belong to this account and browser. Events move to
        Completed after their scheduled start, or after their local date when a
        time is unavailable. Saved details are snapshots; check Ticketmaster for
        changes.
      </p>
    </>
  );
}
