-- ============================================================================
-- Premios entregados por completar la meta de sellos.
--
-- El escáner reinicia el contador a 0 al llegar a la meta, así que la
-- notificación "Recompensa lista" ya no puede deducirse de `sellos` (siempre
-- queda por debajo de la meta). Esta tabla guarda cada premio generado para
-- que el panel de notificaciones muestre los pendientes hasta que el equipo
-- los marque como entregados.
--
-- Correr a mano en Supabase → SQL Editor (no hay CLI en el repo).
-- ============================================================================

create table if not exists public.premios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  folio text not null unique,
  recompensa text not null,
  meta int not null,
  membresia boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado')),
  correo_enviado boolean not null default false,
  correo_enviado_at timestamptz,
  created_at timestamptz not null default now(),
  entregado_at timestamptz
);

create index if not exists premios_pendientes_idx
  on public.premios (estado, created_at desc);

alter table public.premios enable row level security;

-- Staff y admin autenticados: leer los pendientes, insertar al escanear y
-- marcarlos como entregados. El acceso público (anon) queda bloqueado.
drop policy if exists "premios autenticados" on public.premios;
create policy "premios autenticados" on public.premios
  for all
  to authenticated
  using (true)
  with check (true);
