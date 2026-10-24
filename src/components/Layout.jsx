import { useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowUpRight,
  CalendarDays,
  Compass,
  LogOut,
  Sparkles,
  Ticket,
  X,
  CheckCircle2,
} from "lucide-react";
import { logout } from "../features/authSlice";
import { dismissNotice, notify } from "../features/uiSlice";
import { selectMyRegistrations } from "../features/registrationsSlice";
export default function Layout() {
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const user = useSelector((s) => s.auth.user),
    notice = useSelector((s) => s.ui.notice),
    storageError = useSelector((s) => s.ui.storageError),
    registrations = useSelector(selectMyRegistrations);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => dispatch(dismissNotice()), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice, dispatch]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/events" className="brand">
          <span className="brand-symbol">
            g<span />
          </span>
          gather<span className="brand-dot">.</span>
        </Link>
        <span className="nav-label">YOUR NEXT GOOD TIME</span>
        <nav aria-label="Main navigation">
          <NavLink to="/events" end>
            <Compass size={19} /> Discover <span className="nav-arrow">↗</span>
          </NavLink>
          <NavLink to="/my-events">
            <Ticket size={19} /> My events{" "}
            {user && <span className="nav-count">{registrations.length}</span>}
          </NavLink>
        </nav>
        <div className="sidebar-promo">
          <Sparkles size={22} />
          <h3>
            More moments.
            <br />
            Less scrolling.
          </h3>
          <p>Find something worth showing up for.</p>
          <Link to="/events">
            Explore events <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <CalendarDays size={16} />
          <span>Make room for good times.</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-label">
            A little discovery goes a long way.
          </span>
          <div className="topbar-actions">
            {user ? (
              <>
                <span className="avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="user-name">{user.name}</span>
                <button
                  className="icon-button"
                  aria-label="Log out"
                  onClick={() => {
                    dispatch(logout());
                    dispatch(notify("You have been logged out."));
                    navigate("/events");
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">
                  Log in
                </Link>
                <Link to="/register" className="button small-button">
                  Create account <ArrowUpRight size={15} />
                </Link>
              </>
            )}
          </div>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            Your browser could not save changes. They may be lost after a
            refresh. Allow local storage before continuing.
          </div>
        )}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer>
          <Link to="/events" className="footer-brand">
            gather.
          </Link>
          <span>Good plans start here.</span>
          <span>Event data by Ticketmaster</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => dispatch(dismissNotice())}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
