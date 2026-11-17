-- ============================================================================
-- AfroBroccoli · Fase 1 de Miembros
--
-- Ejecutar completo en Supabase → SQL Editor.
-- Es idempotente: se puede volver a correr sin duplicar datos.
--
-- Reglas:
--   · La cuota vence el día 28 de cada mes.
--   · Hay 5 días de gracia.
--   · El primer mes de una membresía nueva es gratis (exento, $0).
--   · Los miembros que ya existían al lanzar la función arrancan con el mes
--     actual pendiente, para que el admin marque quién ya pagó.
--   · Una cuota impaga se marca "revisar" un mes después de su vencimiento.
--   · El staff no puede leer ni escribir membresias_periodos: solo admin.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0) Requisitos de la fase anterior (idempotente)
--
-- La app ya usa estas columnas y funciones. Se incluyen acá para que este
-- archivo sea el único SQL que hay que correr antes de probar Miembros.
-- ---------------------------------------------------------------------------

alter table public.visitas
  add column if not exists membresia boolean not null default false;

comment on column public.visitas.membresia is
  'true = la visita se registró como miembro (ese día tenía membresía al día).';

alter table public.clientes
  add column if not exists cumpleanos_correo_anio integer;

comment on column public.clientes.cumpleanos_correo_anio is
  'Año del último correo de cumpleaños enviado. Evita duplicados.';

-- La tarjeta pública necesita la membresía y la meta regular.
drop function if exists public.tarjeta_cliente(text);
drop function if exists public.tarjeta_cliente(character varying);

create function public.tarjeta_cliente(p_codigo text)
returns table (
  nombre text,
  codigo text,
  membresia boolean,
  sellos integer,
  meta integer,
  recompensa text,
  color_acento text,
  logo_url text
)
language sql
security definer
set search_path = public
as $$
  select
    c.nombre,
    c.codigo,
    c.membresia,
    coalesce(s.cantidad, 0)::integer as sellos,
    coalesce(cfg.meta, 5)::integer as meta,
    coalesce(cfg.recompensa, '1 servicio gratis') as recompensa,
    cfg.color_acento,
    cfg.logo_url
  from public.clientes c
  left join public.sellos s on s.cliente_id = c.id
  left join public.config cfg on cfg.id = 1
  where c.codigo = p_codigo
  limit 1;
$$;

grant execute on function public.tarjeta_cliente(text) to anon, authenticated;

comment on function public.tarjeta_cliente(text) is
  'Datos públicos de la tarjeta. Incluye membresía y la meta regular.';

-- Si la tabla de premios ya existe, asegura la columna que usa la app.
do $$
begin
  if to_regclass('public.premios') is not null then
    alter table public.premios
      add column if not exists membresia boolean not null default false;
  end if;
end $$;

-- Cierra tarjetas que quedaron en o por encima de la meta.
create or replace function public.normalizar_sellos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta integer;
  v_recompensa text;
  v_cliente record;
  v_total integer := 0;
begin
  if auth.uid() is not null
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
     ) then
    raise exception 'Solo el administrador puede regularizar los sellos.';
  end if;

  if to_regclass('public.premios') is null then
    raise exception 'Falta la tabla public.premios. Corré primero la migración de premios.';
  end if;

  select meta, recompensa
    into v_meta, v_recompensa
  from public.config
  where id = 1;

  if coalesce(v_meta, 0) <= 0 then
    return 0;
  end if;

  for v_cliente in
    select c.id, c.codigo, s.cantidad
    from public.clientes c
    join public.sellos s on s.cliente_id = c.id
    where s.cantidad >= v_meta
    order by c.codigo
    for update of s
  loop
    if not exists (
      select 1 from public.premios p
      where p.cliente_id = v_cliente.id
        and p.estado = 'pendiente'
    ) then
      insert into public.premios (cliente_id, folio, recompensa, meta, membresia, estado)
      values (
        v_cliente.id,
        coalesce(nullif(v_cliente.codigo, ''), left(v_cliente.id::text, 8))
          || '-' || to_char(now(), 'YYYYMMDD') || '-'
          || upper(substr(md5(random()::text), 1, 4)),
        coalesce(v_recompensa, '1 servicio gratis'),
        v_meta,
        false,
        'pendiente'
      );
    end if;

    update public.sellos
      set cantidad = 0,
          updated_at = now()
      where cliente_id = v_cliente.id;

    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;

revoke all on function public.normalizar_sellos() from public;
revoke all on function public.normalizar_sellos() from anon;
grant execute on function public.normalizar_sellos() to authenticated, service_role;

comment on function public.normalizar_sellos() is
  'Cierra tarjetas con sellos >= meta: crea premio pendiente (si no hay uno) y reinicia a 0.';

-- ---------------------------------------------------------------------------
-- 1) Configuración de la membresía
-- ---------------------------------------------------------------------------
alter table public.config
  add column if not exists membresia_monto numeric(10,2) not null default 10,
  add column if not exists membresia_dia_cobro integer not null default 28,
  add column if not exists membresia_dias_gracia integer not null default 5;

-- Normaliza valores si la tabla ya existía con datos incompletos.
update public.config
set membresia_monto = coalesce(membresia_monto, 10),
    membresia_dia_cobro = least(greatest(coalesce(membresia_dia_cobro, 28), 1), 28),
    membresia_dias_gracia = greatest(coalesce(membresia_dias_gracia, 5), 0)
where id = 1;

comment on column public.config.membresia_monto is
  'Cuota mensual por defecto. Cada período puede guardar su propio monto.';
comment on column public.config.membresia_dia_cobro is
  'Día del mes en que vence la cuota. Se limita a 1–28.';
comment on column public.config.membresia_dias_gracia is
  'Días de gracia después del vencimiento antes de cortar beneficios.';

-- ---------------------------------------------------------------------------
-- 2) Datos de membresía en clientes
-- ---------------------------------------------------------------------------
alter table public.clientes
  add column if not exists membresia_desde date,
  add column if not exists membresia_primer_mes_gratis boolean not null default false;

-- Los miembros que ya existían arrancan en el mes de lanzamiento. Quedan
-- pendientes (no gratis) para que el admin marque quién está al día.
update public.clientes
set membresia_desde = date_trunc(
      'month',
      (now() at time zone 'America/Panama')
    )::date
where membresia = true
  and membresia_desde is null;

comment on column public.clientes.membresia_desde is
  'Primer mes de la membresía actual. Se usa para generar las cuotas.';
comment on column public.clientes.membresia_primer_mes_gratis is
  'true = la próxima cuota inicial se crea exenta (primer mes de regalo).';

-- ---------------------------------------------------------------------------
-- 3) Tabla de cuotas mensuales
-- ---------------------------------------------------------------------------
create table if not exists public.membresias_periodos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  periodo date not null,
  vence_el date,
  monto numeric(10,2) not null default 0,
  estado text not null default 'pendiente',
  pagado_at timestamptz,
  nota text,
  revisar boolean not null default false,
  recordatorio_at timestamptz,
  recordatorio_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Completa columnas si la tabla ya existía de una corrida anterior.
alter table public.membresias_periodos
  add column if not exists vence_el date,
  add column if not exists monto numeric(10,2) not null default 0,
  add column if not exists estado text not null default 'pendiente',
  add column if not exists pagado_at timestamptz,
  add column if not exists nota text,
  add column if not exists revisar boolean not null default false,
  add column if not exists recordatorio_at timestamptz,
  add column if not exists recordatorio_count integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Restricciones (con DO para que sea idempotente).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'membresias_periodos_estado_check'
      and conrelid = 'public.membresias_periodos'::regclass
  ) then
    alter table public.membresias_periodos
      add constraint membresias_periodos_estado_check
      check (estado in ('pendiente', 'pagado', 'exento'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'membresias_periodos_monto_check'
      and conrelid = 'public.membresias_periodos'::regclass
  ) then
    alter table public.membresias_periodos
      add constraint membresias_periodos_monto_check
      check (monto >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'membresias_periodos_recordatorio_count_check'
      and conrelid = 'public.membresias_periodos'::regclass
  ) then
    alter table public.membresias_periodos
      add constraint membresias_periodos_recordatorio_count_check
      check (recordatorio_count >= 0);
  end if;
end $$;

create unique index if not exists membresias_periodos_cliente_periodo_uidx
  on public.membresias_periodos (cliente_id, periodo);

create index if not exists membresias_periodos_cliente_periodo_idx
  on public.membresias_periodos (cliente_id, periodo desc);

create index if not exists membresias_periodos_estado_vence_idx
  on public.membresias_periodos (estado, vence_el);

create index if not exists membresias_periodos_revisar_idx
  on public.membresias_periodos (revisar)
  where revisar = true;

comment on table public.membresias_periodos is
  'Cuotas mensuales de la membresía. Una fila por cliente y mes.';
comment on column public.membresias_periodos.periodo is
  'Primer día del mes que cubre la cuota (ej. 2026-11-01).';
comment on column public.membresias_periodos.vence_el is
  'Fecha de vencimiento. NULL en el primer mes de regalo.';
comment on column public.membresias_periodos.estado is
  'pendiente = por cobrar; pagado = cobrado; exento = primer mes de regalo.';
comment on column public.membresias_periodos.revisar is
  'true = la cuota lleva más de un mes vencida y el admin debe hablar con la clienta.';

-- Trigger de updated_at.
create or replace function public.membresias_periodos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_membresias_periodos_updated_at
  on public.membresias_periodos;

create trigger trg_membresias_periodos_updated_at
before update on public.membresias_periodos
for each row execute function public.membresias_periodos_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Seguridad: solo el admin puede ver/editar las cuotas
-- ---------------------------------------------------------------------------
alter table public.membresias_periodos enable row level security;

drop policy if exists "membresias_periodos_admin" on public.membresias_periodos;
create policy "membresias_periodos_admin"
  on public.membresias_periodos
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

revoke all on public.membresias_periodos from public;
revoke all on public.membresias_periodos from anon;
grant select, insert, update, delete on public.membresias_periodos to authenticated;
grant all on public.membresias_periodos to service_role;

-- ---------------------------------------------------------------------------
-- 5) Preparar las cuotas del mes
--
-- Crea las cuotas que falten desde membresia_desde hasta el mes actual.
-- La primera cuota de un miembro nuevo queda exenta; las demás, pendientes.
-- No crea meses futuros.
-- ---------------------------------------------------------------------------
create or replace function public.preparar_membresias_mes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_periodo date := date_trunc('month', (now() at time zone 'America/Panama'))::date;
  v_monto numeric(10,2);
  v_dia integer;
  v_cliente record;
  v_inicio date;
  v_ultimo date;
  v_desde date;
  v_mes date;
  v_creados integer := 0;
  v_insertados integer := 0;
begin
  -- En la app solo puede llamarla un admin. En SQL Editor (auth.uid() null)
  -- se permite para poder preparar el mes manualmente.
  if auth.uid() is not null
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
     ) then
    raise exception 'Solo el administrador puede preparar las membresías.';
  end if;

  select coalesce(membresia_monto, 10),
         least(greatest(coalesce(membresia_dia_cobro, 28), 1), 28)
    into v_monto, v_dia
  from public.config
  where id = 1;

  v_monto := coalesce(v_monto, 10);
  v_dia := coalesce(v_dia, 28);

  for v_cliente in
    select c.id, c.membresia_desde, c.membresia_primer_mes_gratis
    from public.clientes c
    where c.membresia = true
    order by c.id
    for update
  loop
    v_inicio := date_trunc(
      'month',
      coalesce(v_cliente.membresia_desde, v_periodo)
    )::date;

    -- Nunca crea cuotas futuras.
    if v_inicio > v_periodo then
      v_inicio := v_periodo;
    end if;

    -- Si el miembro no tiene fecha de inicio, la fijamos al mes que se está
    -- preparando. Así la ficha muestra "Miembro desde" y no queda en null.
    if v_cliente.membresia_desde is null then
      update public.clientes
      set membresia_desde = v_inicio
      where id = v_cliente.id;
    end if;

    select max(mp.periodo)
      into v_ultimo
    from public.membresias_periodos mp
    where mp.cliente_id = v_cliente.id;

    if v_ultimo is null then
      if coalesce(v_cliente.membresia_primer_mes_gratis, false) then
        insert into public.membresias_periodos
          (cliente_id, periodo, vence_el, monto, estado)
        values
          (v_cliente.id, v_inicio, null, 0, 'exento')
        on conflict (cliente_id, periodo) do nothing;

        get diagnostics v_insertados = row_count;
        v_creados := v_creados + v_insertados;

        update public.clientes
        set membresia_primer_mes_gratis = false
        where id = v_cliente.id;

        v_desde := (v_inicio + interval '1 month')::date;
      else
        insert into public.membresias_periodos
          (cliente_id, periodo, vence_el, monto, estado)
        values
          (
            v_cliente.id,
            v_inicio,
            make_date(
              extract(year from v_inicio)::int,
              extract(month from v_inicio)::int,
              v_dia
            ),
            v_monto,
            'pendiente'
          )
        on conflict (cliente_id, periodo) do nothing;

        get diagnostics v_insertados = row_count;
        v_creados := v_creados + v_insertados;

        v_desde := (v_inicio + interval '1 month')::date;
      end if;
    else
      -- Si volvió a entrar a la membresía, arranca en la fecha nueva.
      -- Cuando el mes nuevo es posterior al último período, todavía tiene
      -- derecho al primer mes de regalo de esta nueva etapa.
      if coalesce(v_cliente.membresia_primer_mes_gratis, false)
         and v_inicio > v_ultimo then
        insert into public.membresias_periodos
          (cliente_id, periodo, vence_el, monto, estado)
        values
          (v_cliente.id, v_inicio, null, 0, 'exento')
        on conflict (cliente_id, periodo) do nothing;

        get diagnostics v_insertados = row_count;
        v_creados := v_creados + v_insertados;

        update public.clientes
        set membresia_primer_mes_gratis = false
        where id = v_cliente.id;

        v_desde := (v_inicio + interval '1 month')::date;
      else
        -- Si el mes nuevo ya existía, no se puede crear otro período para el
        -- mismo mes. Se descarta el regalo pendiente y se sigue desde el
        -- período siguiente al último que ya existe.
        if coalesce(v_cliente.membresia_primer_mes_gratis, false) then
          update public.clientes
          set membresia_primer_mes_gratis = false
          where id = v_cliente.id;
        end if;

        v_desde := greatest(
          v_inicio,
          (v_ultimo + interval '1 month')::date
        );
      end if;
    end if;

    if v_desde <= v_periodo then
      for v_mes in
        select generate_series(v_desde, v_periodo, interval '1 month')::date
      loop
        insert into public.membresias_periodos
          (cliente_id, periodo, vence_el, monto, estado)
        values
          (
            v_cliente.id,
            v_mes,
            make_date(
              extract(year from v_mes)::int,
              extract(month from v_mes)::int,
              v_dia
            ),
            v_monto,
            'pendiente'
          )
        on conflict (cliente_id, periodo) do nothing;

        get diagnostics v_insertados = row_count;
        v_creados := v_creados + v_insertados;
      end loop;
    end if;

  end loop;

  return v_creados;
end;
$$;

revoke all on function public.preparar_membresias_mes() from public;
revoke all on function public.preparar_membresias_mes() from anon;
grant execute on function public.preparar_membresias_mes() to authenticated, service_role;

comment on function public.preparar_membresias_mes() is
  'Crea las cuotas mensuales que falten hasta el mes actual. No crea meses futuros.';

-- ---------------------------------------------------------------------------
-- 6) Estado de membresía para el escáner
--
-- Devuelve solo lo necesario para decidir si la visita cuenta como miembro.
-- No expone montos ni historial al staff.
-- ---------------------------------------------------------------------------
create or replace function public.membresia_estado(p_cliente_id uuid)
returns table (
  al_dia boolean,
  estado text,
  revisar boolean,
  periodo date,
  vence_el date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Panama')::date;
  v_mes_actual date := date_trunc('month', (now() at time zone 'America/Panama'))::date;
  v_gracia integer;
  v_es_miembro boolean;
  v_vencido_periodo date;
  v_vencido_vence date;
  v_pendiente_periodo date;
  v_pendiente_vence date;
  v_revisar boolean := false;
  v_hay_periodo boolean := false;
begin
  select c.membresia
    into v_es_miembro
  from public.clientes c
  where c.id = p_cliente_id;

  if not found or not coalesce(v_es_miembro, false) then
    return query
      select true, 'sin_membresia'::text, false, null::date, null::date;
    return;
  end if;

  select coalesce(membresia_dias_gracia, 5)
    into v_gracia
  from public.config
  where id = 1;

  v_gracia := coalesce(v_gracia, 5);

  select exists (
    select 1
    from public.membresias_periodos mp
    where mp.cliente_id = p_cliente_id
      and mp.periodo <= v_mes_actual
  )
  into v_hay_periodo;

  select exists (
    select 1
    from public.membresias_periodos mp
    where mp.cliente_id = p_cliente_id
      and mp.revisar = true
  )
  into v_revisar;

  -- Primera cuota vencida (fuera del período de gracia).
  select mp.periodo, mp.vence_el
    into v_vencido_periodo, v_vencido_vence
  from public.membresias_periodos mp
  where mp.cliente_id = p_cliente_id
    and mp.periodo <= v_mes_actual
    and mp.estado = 'pendiente'
    and mp.vence_el is not null
    and v_hoy > (mp.vence_el + v_gracia)
  order by mp.periodo
  limit 1;

  if v_vencido_periodo is not null then
    return query
      select false, 'vencido'::text, v_revisar,
             v_vencido_periodo, v_vencido_vence;
    return;
  end if;

  -- Cuota pendiente pero todavía dentro de la gracia.
  select mp.periodo, mp.vence_el
    into v_pendiente_periodo, v_pendiente_vence
  from public.membresias_periodos mp
  where mp.cliente_id = p_cliente_id
    and mp.periodo <= v_mes_actual
    and mp.estado = 'pendiente'
  order by mp.periodo
  limit 1;

  if v_pendiente_periodo is not null then
    return query
      select true, 'pendiente'::text, v_revisar,
             v_pendiente_periodo, v_pendiente_vence;
    return;
  end if;

  if not v_hay_periodo then
    -- Todavía no se preparó el mes: no cortamos beneficios por las dudas.
    return query
      select true, 'sin_periodo'::text, v_revisar, null::date, null::date;
    return;
  end if;

  return query
    select true, 'al_dia'::text, v_revisar, null::date, null::date;
end;
$$;

revoke all on function public.membresia_estado(uuid) from public;
revoke all on function public.membresia_estado(uuid) from anon;
grant execute on function public.membresia_estado(uuid) to authenticated, service_role;

comment on function public.membresia_estado(uuid) is
  'Estado de membresía para el escáner: al_dia, pendiente, vencido, sin_periodo o sin_membresia.';

-- ---------------------------------------------------------------------------
-- 7) Marcar cuotas para revisar
--
-- Se ejecuta al abrir Miembros. Una cuota pendiente pasa a revisar cuando
-- pasó un mes desde su vencimiento.
-- ---------------------------------------------------------------------------
create or replace function public.marcar_membresias_revisar()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Panama')::date;
  v_total integer := 0;
begin
  if auth.uid() is not null
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
     ) then
    raise exception 'Solo el administrador puede marcar membresías para revisar.';
  end if;

  update public.membresias_periodos
  set revisar = true
  where estado = 'pendiente'
    and revisar = false
    and vence_el is not null
    and (vence_el + interval '1 month')::date <= v_hoy;

  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

revoke all on function public.marcar_membresias_revisar() from public;
revoke all on function public.marcar_membresias_revisar() from anon;
grant execute on function public.marcar_membresias_revisar() to authenticated, service_role;

comment on function public.marcar_membresias_revisar() is
  'Marca para revisar las cuotas pendientes con más de un mes desde el vencimiento.';

-- ---------------------------------------------------------------------------
-- 8) Preparar el mes ahora (opcional, para ver datos de inmediato)
-- ---------------------------------------------------------------------------
select public.preparar_membresias_mes() as cuotas_creadas;

-- Normaliza las tarjetas que quedaron en o por encima de la meta. Es
-- idempotente: no duplica premios pendientes y deja el contador en 0.
do $$
begin
  if to_regclass('public.premios') is not null then
    perform public.normalizar_sellos();
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
