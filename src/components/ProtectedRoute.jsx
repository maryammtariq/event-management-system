import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
export default function ProtectedRoute({ children }) {
  const user = useSelector((s) => s.auth.user),
    location = useLocation();
  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
