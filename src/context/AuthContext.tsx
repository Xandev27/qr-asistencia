import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";
import type { UserSession, Role } from "../types/attendance";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Usamos useCallback para mantener estable la referencia de la función
  const fetchUserProfile = useCallback(async (userId: string, email: string): Promise<UserSession | null> => {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("role, name")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error al obtener perfil de usuario:", error.message);
      }

      return {
        id: userId,
        email,
        role: (profile?.role as Role) || "employee",
        name: profile?.name || "Usuario",
      };
    } catch (err) {
      console.error("Error inesperado obteniendo perfil:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Supabase maneja la carga inicial mediante el evento INITIAL_SESSION en onAuthStateChange
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userSession = await fetchUserProfile(session.user.id, session.user.email || "");
        
        // Evitamos actualizar el estado si el componente se desmontó a mitad de petición
        if (isMounted) {
          setUser(userSession);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem("pending_qr_token");
      await supabase.auth.signOut();
      // No hace falta setUser(null) aquí; el listener de onAuthStateChange lo gestiona automáticamente
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}