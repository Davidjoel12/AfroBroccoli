import { Cliente, Periodo } from "./types";

export const metricas = {
  clientesTotales: 117,
  visitasHoy: 0,
  sellosTotales: 174,
};

export const clientes: Cliente[] = [
  { nombre: "Alice Cooper", correo: "alicecoope@gmail.com", pais: "pa", telefono: "50769000001", telefonoFormato: "+507 6900 0001", sellos: 4, metaSellos: 5, membresia: false },
  { nombre: "Derrick Lue", correo: "derrick@luemail.com", pais: "cr", telefono: "50688000002", telefonoFormato: "+506 8800 0002", sellos: 2, metaSellos: 5, membresia: false },
  { nombre: "Yunit Razo", correo: "yunitrazo@gmail.com", pais: "ve", telefono: "50769000003", telefonoFormato: "+507 6900 0003", sellos: 5, metaSellos: 5, membresia: true },
  { nombre: "Johnny Ríos", correo: "johnnyrios@gmail.com", pais: "pa", telefono: "50769000004", telefonoFormato: "+507 6900 0004", sellos: 1, metaSellos: 5, membresia: false },
  { nombre: "Joaquin Diaz", correo: "joaqudiaz@gmail.com", pais: "pe", telefono: "50769000005", telefonoFormato: "+507 6900 0005", sellos: 3, metaSellos: 5, membresia: true },
  { nombre: "María Fernanda", correo: "mfernanda@gmail.com", pais: "mx", telefono: "50769000006", telefonoFormato: "+507 6900 0006", sellos: 0, metaSellos: 5, membresia: false },
  { nombre: "Carlos Pérez", correo: "carlosp@gmail.com", pais: "co", telefono: "50769000007", telefonoFormato: "+507 6900 0007", sellos: 5, metaSellos: 5, membresia: true },
  { nombre: "Ana Lucía", correo: "analucia@gmail.com", pais: "pa", telefono: "50769000008", telefonoFormato: "+507 6900 0008", sellos: 4, metaSellos: 5, membresia: true },
];

export const distribucion = [62, 55]; // regulares, membresía

export const seriesVisitas: Record<Periodo, { labels: string[]; regulares: number[]; membresia: number[] }> = {
  dia: {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    regulares: [2, 4, 1, 3, 0, 5, 2],
    membresia: [1, 2, 1, 0, 1, 3, 1],
  },
  semana: {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    regulares: [12, 18, 9, 14],
    membresia: [8, 10, 5, 9],
  },
  mes: {
    labels: ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    regulares: [42, 51, 38, 60, 55, 47],
    membresia: [20, 26, 18, 30, 27, 22],
  },
};
