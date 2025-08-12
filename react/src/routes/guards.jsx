import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;        // 스피너 넣어도 됨
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ must, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (must && user.role !== must) return <Navigate to="/" replace />;
  return children;
}
