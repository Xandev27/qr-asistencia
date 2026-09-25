import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/attendance";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: React.ReactElement;
}

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Esperar a que el Contexto lea localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAllowed = !allowedRoles || allowedRoles.includes(user.role as Role) || (user.role === "superadmin" && allowedRoles.includes("admin" as Role));

  if (!isAllowed) {
    const targetPath = user.role === "employee" ? "/scan" : "/admin/dashboard";
    if (location.pathname === targetPath) return children;
    return <Navigate to={targetPath} replace />;
  }

  return children;
}