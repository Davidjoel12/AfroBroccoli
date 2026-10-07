export type Cliente = {
  id: string;
  nombre: string;
  correo: string;
  pais: string; // código ISO para la bandera (fi)
  telefono: string; // internacional sin "+"
  telefonoFormato: string; // "+507 6000 0001"
  sellos: number; // sellos acumulados
  metaSellos: number; // sellos para la próxima recompensa
  membresia: boolean;
  visitas: number; // cantidad total de visitas
};

export type Periodo = "dia" | "semana" | "mes";
