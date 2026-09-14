import React from 'react';
import { Navigate } from 'react-router-dom';
import type { UserSession, Role } from '../types/attendance';

interface ProtectedRouteProps {
  user: UserSession | null;
  allowedRoles?: Role[];
  children: React.ReactElement;
}

export default function ProtectedRoute({ user, allowedRoles, children }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos y el usuario no tiene ninguno de ellos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirección inteligente según el rol real del usuario
    if (user.role === 'empleado') {
      return <Navigate to="/scan" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}