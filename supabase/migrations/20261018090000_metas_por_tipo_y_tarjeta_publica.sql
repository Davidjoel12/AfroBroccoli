-- ============================================================================
-- AfroBroccoli · 18/10/2026
-- 1) Metas de sellos separadas: clientes regulares vs clientes miembros
-- 2) Tarjeta de cliente pública (/c/[codigo]) accesible sin login
--
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- Pegarlo en Supabase → SQL Editor → Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Configuración: una meta y una recompensa por tipo de cliente
-- ---------------------------------------------------------------------------
alter table public.config add column if not exists meta_membresia integer;
alter table public.config add column if not exists recompensa_membresia text;

-- Los clientes que ya estaban configurados arrancan con la misma meta y la
-- misma recompensa que los regulares; las chicas ajustan los valores después.
update public.config set meta_membresia = meta where meta_membresia is null;
update public.config set recompensa_membresia = recompensa where recompensa_membresia is null;

alter table public.config alter column meta_membresia set default 5;
alter table public.config alter column meta_membresia set not null;
alter table public.config alter column recompensa_membresia set default '1 servicio gratis';
alter table public.config alter column recompensa_membresia set not null;

-- ---------------------------------------------------------------------------
-- 2) Tarjeta pública del cliente
--
-- La página /c/AB-0042 la abre el cliente final desde WhatsApp, sin cuenta.
-- Por eso no puede leer `clientes` con la anon key (RLS lo bloquea): lo hace
-- esta función, que devuelve SOLO lo que el cliente ve en su tarjeta.
-- El código (AB-0000) es el dato secreto: quien no tenga el enlace no ve la tarjeta.
-- ---------------------------------------------------------------------------
create or replace function public.tarjeta_cliente(p_codigo text)
returns table (
  codigo         text,
  nombre         text,
  membresia      boolean,
  sellos         integer,
  meta           integer,
  recompensa     text,
  color_acento   text,
  logo_url       text
)
language sql
security definer
set search_path = public
as $$
  select
    c.codigo,
    c.nombre,
    c.membresia,
    coalesce(s.cantidad, 0)::integer,
    case when c.membresia then cfg.meta_membresia else cfg.meta end::integer,
    case when c.membresia then cfg.recompensa_membresia else cfg.recompensa end,
    cfg.color_acento,
    cfg.logo_url
  from public.clientes c
  left join public.sellos s on s.cliente_id = c.id
  cross join (select * from public.config where id = 1) cfg
  where lower(c.codigo) = lower(trim(p_codigo))
  limit 1;
$$;

-- Solo la app (anon = el cliente sin login, authenticated = el equipo del salón).
revoke execute on function public.tarjeta_cliente(text) from public;
grant execute on function public.tarjeta_cliente(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Verificación (opcional): descomentar y correr para ver la fila actual
-- ---------------------------------------------------------------------------
-- select meta, meta_membresia, recompensa, recompensa_membresia from public.config;