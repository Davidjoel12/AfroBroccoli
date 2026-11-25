import type { SupabaseClient } from "@supabase/supabase-js";
import { claveDia } from "./fechas";
import {
  erroresDe,
  type Campana,
  type MiembroPromocion,
} from "./campanas";

// ============================================================================
// Lectura de datos de Promociones
//
// La página renderiza su esqueleto al instante y estos datos se cargan en el
// cliente, igual que Perfil y Personalizar tarjeta. El envío real sigue en
// /api/miembros/promocion, que valida el rol de admin en el servidor.
// ============================================================================

type ClienteFila = {
  id: string;
  nombre: string;
  codigo: string | null;
  email: string | null;
  promociones_opt_out: boolean | null;
};

type CampanaFila = {
  id: string;
  asunto: string;
  titulo: string;
  mensaje: string;
  vigente_hasta: string | null;
  enviada_at: string;
  enviados: number | string | null;
  omitidos: number | string | null;
  errores: unknown;
};

export type DatosPromociones = {
  miembros: MiembroPromocion[];
  campanas: Campana[];
  setupError: string | null;
  hoy: string;
};

export async function cargarDatosPromociones(
  sb: SupabaseClient
): Promise<DatosPromociones> {
  let setupError = "";

  const [{ data: clientesData, error: errClientes }, { data: campanasData, error: errCampanas }] =
    await Promise.all([
      sb
        .from("clientes")
        .select("id, nombre, codigo, email, promociones_opt_out")
        .eq("membresia", true)
        .order("nombre"),
      sb
        .from("campanas")
        .select(
          "id, asunto, titulo, mensaje, vigente_hasta, enviada_at, enviados, omitidos, errores"
        )
        .order("enviada_at", { ascending: false })
        .limit(12),
    ]);

  let filasClientes = (clientesData ?? []) as ClienteFila[];

  if (errClientes) {
    console.error(
      "[promociones:clientes]",
      errClientes.code,
      errClientes.message
    );
    setupError = errClientes.message;

    // Sin la columna nueva igual mostramos los miembros, pero el envío queda
    // desactivado hasta que se corra el SQL.
    const { data: baseData } = await sb
      .from("clientes")
      .select("id, nombre, codigo, email")
      .eq("membresia", true)
      .order("nombre");

    filasClientes = ((
      baseData ?? []
    ) as Array<Omit<ClienteFila, "promociones_opt_out">>).map((cliente) => ({
      ...cliente,
      promociones_opt_out: false,
    }));
  }

  if (errCampanas) {
    console.error(
      "[promociones:campanas]",
      errCampanas.code,
      errCampanas.message
    );
    if (!setupError) setupError = errCampanas.message;
  }

  const miembros: MiembroPromocion[] = filasClientes.map((cliente) => ({
    id: cliente.id,
    nombre: cliente.nombre,
    codigo: (cliente.codigo ?? "").trim(),
    correo: (cliente.email ?? "").trim(),
    optOut: Boolean(cliente.promociones_opt_out),
  }));

  const campanas: Campana[] = ((campanasData ?? []) as CampanaFila[]).map(
    (fila) => ({
      id: fila.id,
      asunto: fila.asunto,
      titulo: fila.titulo,
      mensaje: fila.mensaje,
      vigenteHasta: fila.vigente_hasta,
      enviadaAt: fila.enviada_at,
      enviados: Number(fila.enviados) || 0,
      omitidos: Number(fila.omitidos) || 0,
      errores: erroresDe(fila.errores),
    })
  );

  return {
    miembros,
    campanas,
    setupError: setupError || null,
    hoy: claveDia(),
  };
}
