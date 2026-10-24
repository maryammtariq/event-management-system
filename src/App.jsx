import { Route, Routes, Navigate, Link } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import MyEventsPage from "./pages/MyEventsPage";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage registering />} />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="state-card">
              <span className="eyebrow">404</span>
              <h1>This plan took a wrong turn.</h1>
              <p>The page you’re looking for doesn’t exist.</p>
              <Link className="button" to="/events">
                Back to discovery
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
