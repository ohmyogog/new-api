import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

function getUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function PrivateRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!getUser()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (typeof user.role !== 'number' || user.role < 10) {
    return <Navigate to="/forbidden" replace />;
  }
  return <>{children}</>;
}

export function AuthRedirect({ children }: { children: ReactNode }) {
  if (getUser()) {
    return <Navigate to="/console" replace />;
  }
  return <>{children}</>;
}
