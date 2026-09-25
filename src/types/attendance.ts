// --- GEOLOCALIZACIÓN Y UBICACIÓN ---
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface Dependencia {
  id: string;
  nombre: string;
  codigoQrToken: string;
  ubicacion: Coordinates;
  radioToleranciaMetros: number;
  createdAt: string;
}

// --- PAYLOAD PARA REGISTRAR ASISTENCIA ---
export interface AttendancePayload {
  qrToken: string;
  location: Coordinates;
  timestamp?: string;
}

// --- RESPUESTA DEL BACKEND TRAS ESCANEAR ---
export interface AttendanceResponse {
  success: boolean;
  message: string;
  timestamp: string;
  type: "IN" | "OUT"; // Define si marca entrada o salida
  locationValid: boolean; // Si la distancia a la sede es aceptable
  employee: {
    id: string;
    name: string;
  };
}

// --- SESIÓN Y AUTENTICACIÓN ---
export type Role = "employee" | "admin" | "superadmin";

export interface UserSession {
  id: string;
  name: string;
  role: Role;
  department?: string;
  email: string;
}

// --- DATOS DEL REPORTE (Para Recharts / Tablas) ---
export interface AttendanceMetric {
  id: string;
  name: string;
  department: string;
  attendance: number; // Porcentaje (0 a 100)
  presentDays: number;
  totalDays: number;
}
