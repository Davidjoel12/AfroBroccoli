export type Cliente = {
  id: string;
  codigo: string; // código único (AB-0042): es el link de su tarjeta pública
  nombre: string;
  correo: string;
  pais: string | null; // código ISO para la bandera; null = sin nacionalidad cargada
  telefono: string; // internacional sin "+"
  telefonoFormato: string; // "+507 6000 0001"
  sellos: number; // sellos acumulados
  metaSellos: number; // sellos para la próxima recompensa (según si es miembro o no)
  membresia: boolean;
  visitas: number; // cantidad total de visitas
  fechaNacimiento?: string | null; // "YYYY-MM-DD" para notificaciones de cumpleaños
  ultimaVisita?: string | null; // ISO string de la última visita (para notificación de inactividad)
};

export type Periodo = "dia" | "semana" | "mes";

/** Fila de `premios` lista para mostrarse como notificación pendiente. */
export type Premio = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteCodigo: string;
  telefono?: string;
  folio: string;
  recompensa: string;
  meta: number;
  /** ISO string de `created_at`. */
  fecha: string;
};
