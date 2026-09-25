import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";
import type { UserSession, Role } from "../types/attendance";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  updateUserProfile: (firstName: string, lastName: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState<boolean>(false);

  // Consulta extendida para traer 'first_name' y 'last_name'
  const fetchUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("role, name, first_name, last_name")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error al obtener perfil de usuario:", error.message);
      }

      // Si no tiene 'first_name' o 'last_name', marcar que requiere completar perfil
      const missingName = !profile?.first_name || !profile?.last_name;

      return {
        session: {
          id: userId,
          email,
          role: (profile?.role as Role) || "employee",
          name: profile?.name || "Usuario",
        } as UserSession,
        missingName,
      };
    } catch (err) {
      console.error("Error inesperado obteniendo perfil:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const result = await fetchUserProfile(session.user.id, session.user.email || "");

        if (isMounted && result) {
          setUser(result.session);
          setNeedsProfileCompletion(result.missingName);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setNeedsProfileCompletion(false);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Método para actualizar el estado tras guardar en el modal
  const updateUserProfile = (firstName: string, lastName: string) => {
    if (user) {
      setUser({
        ...user,
        name: `${firstName} ${lastName}`,
      });
      setNeedsProfileCompletion(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem("pending_qr_token");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsProfileCompletion,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}