import { AlertCircle, ArrowRight, KeyRound, SearchX } from "lucide-react";
export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-card" role="alert">
      <span className="state-icon">
        <AlertCircle />
      </span>
      <h2>Let’s try that again</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "No events found",
  text = "Try another city, keyword or date range.",
  action,
}) {
  return (
    <div className="state-card">
      <span className="state-icon">
        <SearchX />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function ApiSetup() {
  return (
    <div className="setup-card">
      <span className="state-icon">
        <KeyRound />
      </span>
      <div>
        <span className="eyebrow">ONE QUICK SETUP</span>
        <h2>Connect your world of events.</h2>
        <p>
          Gather uses live Ticketmaster events. Add your Consumer Key to{" "}
          <code>VITE_TICKETMASTER_API_KEY</code> in your local <code>.env</code>{" "}
          file, then restart the development server.
        </p>
        <a
          className="button"
          href="https://developer.ticketmaster.com/"
          target="_blank"
          rel="noreferrer"
        >
          Get a free API key <ArrowRight size={17} />
        </a>
        <p className="muted small">
          See README.md for the complete setup. Your key is never included in
          this project.
        </p>
      </div>
    </div>
  );
}
export function Loading({ detail = false }) {
  return (
    <div role="status" aria-label="Loading events">
      <span className="sr-only">Loading events…</span>
      {detail ? (
        <div className="skeleton detail-skeleton" />
      ) : (
        <div className="event-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card-skeleton">
              <div className="skeleton" />
              <div className="skeleton line" />
              <div className="skeleton line short" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
