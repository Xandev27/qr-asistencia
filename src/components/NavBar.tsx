import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Users,
  ClipboardList
} from "lucide-react";
import type { UserSession } from "../types/attendance";

interface SidebarProps {
  user: UserSession | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function SidebarLayout({
  user,
  onLogout,
  children,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
    } ${isCollapsed ? "justify-center px-2" : ""}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* HEADER MÓVIL (Solo pantallas pequeñas) */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between text-white sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-sm">Control Asistencia</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* OVERLAY PARA MÓVIL */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* SIDEBAR (Escritorio + Drawer Móvil) */}
      <aside
        className={`
        fixed md:sticky top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800/80 text-white
        flex flex-col justify-between transition-all duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "md:w-20" : "md:w-64"}
      `}
      >
        <div>
          {/* LOGO & BOTÓN COLAPSA (Escritorio) */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between h-16">
            <div
              className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center w-full" : ""}`}
            >
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg ñshrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap">
                  <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
                    Control Asistencia
                  </h1>
                  <span className="text-[10px] text-indigo-400 font-mono block">
                    {user?.role === "admin" ? "Superusuario" : "Administrador"}
                  </span>
                </div>
              )}
            </div>

            {/* Toggle Colapsar (Solo Desktop) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isCollapsed ? "Expandir" : "Contraer"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="p-3 space-y-1.5">
            <NavLink
              to="/admin/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className={navLinkClass}
              title="Métricas"
            >
              <BarChart3 className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Métricas</span>}
            </NavLink>

            <NavLink
              to="/admin/asistencias"
              onClick={() => setIsMobileOpen(false)}
              className={navLinkClass}
              title="Asistencias y Auditoría"
            >
              <ClipboardList className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Asistencias</span>}
            </NavLink>

            <NavLink
              to="/admin/dependencias"
              onClick={() => setIsMobileOpen(false)}
              className={navLinkClass}
              title="Dependencias"
            >
              <Building2 className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Dependencias</span>}
            </NavLink>


            <NavLink
              to="/admin/empleados"
              onClick={() => setIsMobileOpen(false)}
              className={navLinkClass}
              title="Personal"
            >
              <Users className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Personal</span>}
            </NavLink>
            
            <NavLink
              to="/admin/qr-cards"
              onClick={() => setIsMobileOpen(false)}
              className={navLinkClass}
              title="Tarjetas QR"
            >
              <QrCode className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Tarjetas QR</span>}
            </NavLink>

            <NavLink
              to="/admin/configuracion"
              onClick={() => setIsMobileOpen(false)}
              className={navLinkClass}
              title="Configuración"
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Configuración</span>}
            </NavLink>
          </nav>
        </div>

        {/* PERFIL & LOGOUT */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 ${isCollapsed ? "justify-center" : "justify-between"}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-xs shrink-0">
                {user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize truncate">
                    {user?.role}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
