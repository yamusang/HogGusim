import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export const routeForRole = (role) => {
  switch ((role || '').toUpperCase()) {
    case 'SENIOR':  return '/senior';
    case 'MANAGER': return '/manager';
    case 'SHELTER': return '/shelter';
    default:        return '/';
  }
};

// 로그인 필요
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname)}`} replace />;
  return <Outlet />;
}

// 로그인 상태면 접근 금지(로그인/회원가입 등)
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={routeForRole(user.role)} replace />;
  return <Outlet />;
}

// 특정 역할만 접근
export function RoleOnlyRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if ((user.role || '').toUpperCase() !== (role || '').toUpperCase()) {
    return <Navigate to={routeForRole(user.role)} replace />;
  }
  return <Outlet />;
}
