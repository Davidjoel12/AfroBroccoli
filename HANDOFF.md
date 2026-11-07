# HANDOFF — AfroBroccoli (sesión 2026-10-06 → 2026-11-06)

> Prompt de continuidad para otra IA. Leer completo antes de trabajar. Idioma de la UI y de la conversación: **español** (voseo en el copy: "Elegí", "Verificá", "Apuntá").

## 0. Sesión 2026-11-06 — cumpleaños automático + aviso a los 4 sellos

### Modelo nuevo
- El correo de premio **ya no sale al completar la meta**. Ahora sale al quedar a **1 sello** (`nuevaCantidad === meta - 1`), con la plantilla `construirCorreoAviso`.
- Al completar la meta se sigue guardando el premio pendiente en `premios` y la campana muestra **Recompensa pendiente**; no se manda correo automático.
- La campana agrega `casi_premio` cuando `sellos === metaSellos - 1` (y no hay premio pendiente). Se calcula desde los clientes, sin tabla nueva. Al hacer clic ofrece un WhatsApp de recordatorio.
- **Cumpleaños:** cron diario de Vercel a las 9:00 AM de Panamá (`0 14 * * *` UTC) en `/api/cron/cumpleanos`. Envía la felicitación y guarda `clientes.cumpleanos_correo_anio` para no repetir el envío.
- `lib/email.ts` centraliza Gmail/Brevo/Resend. `/api/premio` quedó para reenvíos manuales; el flujo automático usa `/api/aviso` (aviso de 4 sellos) y el cron (cumpleaños).
- `lib/premios.ts` agrega `construirCorreoAviso` y `construirCorreoCumpleanos`.
- `proxy.ts` agrega `/api/cron/` a las rutas públicas. El cron no usa cookie de sesión: se autentica solo con `CRON_SECRET`.

### SQL pendiente (ejecutar en Supabase → SQL Editor)
```sql
alter table public.clientes
  add column if not exists cumpleanos_correo_anio integer;

comment on column public.clientes.cumpleanos_correo_anio is
  'Año del último correo de cumpleaños enviado. Evita duplicados.';

notify pgrst, 'reload schema';
```
> Si la columna no existe, `/api/cron/cumpleanos` responde 500 `falta_columna` con el aviso para correr este bloque.

### Variables nuevas en Vercel
- `SUPABASE_SERVICE_ROLE_KEY`: service role key del proyecto. Es **solo para el servidor**; no la pongas en una variable `NEXT_PUBLIC_*`.
- `CRON_SECRET`: una clave larga y aleatoria. Vercel la manda como `Authorization: Bearer ...` al cron.
- Después de agregarlas, **Redeploy**.

### Cron
- `vercel.json` nuevo:
```json
{ "crons": [{ "path": "/api/cron/cumpleanos", "schedule": "0 14 * * *" }] }
```
- 14:00 UTC = 9:00 AM en Panamá (Panamá no tiene horario de verano).
- Prueba manual:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/cron/cumpleanos
```
- Vercel Cron solo corre en producción. Si el plan no permite cron, se puede llamar la misma ruta desde otro scheduler con el mismo header.
- El cron devuelve `{ ok, fecha, enviados, omitidos, errores }`. Un segundo llamado el mismo día debe dar `omitidos >= 1` para los que ya recibieron.

### Verificación
- `npx tsc --noEmit` OK · `npx next build` OK · lint con los mismos 4 errores / 3 warnings preexistentes.
- Pendiente: correr el SQL, agregar las dos variables, redeploy y probar:
  - escanear un cliente hasta **4/5** → correo de aviso + campana **Casi premio**;
  - escanear el **5.º** → premio pendiente en la campana, sin correo automático;
  - poner a un cliente de prueba con cumpleaños de hoy → correo y `cumpleanos_correo_anio` actualizado;
  - segundo llamado del cron el mismo día → `omitidos` y sin correo repetido.

## 0a. Sesión 2026-11-06 — membresía como suscripción + tarjeta regular única

### Modelo nuevo (reemplaza el anterior)
- Un cliente **siempre es cliente regular** y acumula sellos. La membresía es una **suscripción mensual aparte** (beneficios/servicios por temporada), no un segundo programa de sellos.
- `clientes.membresia` sigue siendo el booleano, pero ahora significa **"además tiene membresía"**. No reemplaza la tarjeta regular.
- Un miembro aparece en **las dos tablas** de Home: "Clientes" (todos) y "Clientes membresía". En la primera lleva un badge **Miembro** y se ven sus sellos; en la segunda **no se muestran sellos** (la membresía se gestiona aparte, aunque el miembro siga acumulando en su tarjeta regular).
- La visita se guarda con `visitas.membresia` (nuevo). Se setea al escanear con el estado de ese día, así el histórico no cambia si después entra o sale de la membresía.
- **Una sola meta/recompensa para todos**: se eliminaron `metaMembresia`, `recompensaMembresia`, `metaDeCliente()` y `recompensaDeCliente()`. El escáner, Home, el modal de editar y la tarjeta pública usan `config.meta` / `config.recompensa`.
- El premio de sellos se registra con `premios.membresia = false` (es el premio de la tarjeta regular). La membresía no altera el ciclo de sellos.
- Se aprovechó para completar `ultimaVisita` en Home (antes no se pasaba y la notificación de inactividad no podía dispararse).

### SQL pendiente (ejecutar en Supabase → SQL Editor antes de probar)
```sql
-- Todo en una transacción: si algo falla, no se queda a medias.
begin;

-- 1) La visita guarda si fue como miembro.
alter table public.visitas
  add column if not exists membresia boolean not null default false;

-- 2) Histórico: conserva la clasificación que ya mostraba el dashboard.
--    Si preferís no reescribir el pasado, saltá este update.
update public.visitas v
set membresia = coalesce(c.membresia, false)
from public.clientes c
where v.cliente_id = c.id
  and v.membresia is distinct from coalesce(c.membresia, false);

-- 3) La tarjeta pública siempre usa la meta/recompensa regular.
drop function if exists public.tarjeta_cliente(text);

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

comment on column public.clientes.membresia is
  'true = además tiene membresía mensual. Todos los clientes acumulan sellos en su tarjeta regular.';
comment on column public.visitas.membresia is
  'true = la visita se registró como miembro (ese día tenía membresía).';

-- Refresca la caché de PostgREST para que la app vea la columna/función nuevas.
notify pgrst, 'reload schema';

commit;

-- Opcional, después de deployar la versión nueva:
-- alter table public.config drop column if exists meta_membresia;
-- alter table public.config drop column if exists recompensa_membresia;
```
> Si la función actual usa `varchar` en vez de `text`, cambiá el tipo en el `drop function` y en `create function` (o ejecutá solo el `create or replace` si el retorno coincide).

### SQL adicional — regularizar tarjetas que quedaron en la meta

Ejecutar **después** del bloque anterior (y después de la migración de `premios` si todavía no está corrida). Crea la función que usa Configuración al cambiar la meta y, al final, la ejecuta una vez para arreglar los contadores atrasados. Por cada cliente con `sellos.cantidad >= config.meta` crea **un premio pendiente** (si no tiene uno) y deja el contador en **0**.

```sql
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
  -- En la app solo puede llamarla un admin. En SQL Editor (auth.uid() null)
  -- se permite para poder correr la regularización manual.
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
    -- Si ya hay un premio pendiente no duplicamos; solo reiniciamos.
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
  'Cierra tarjetas con sellos >= meta: crea premio pendiente (si no hay uno) y reinicia a 0. Devuelve cuántas tarjetas regularizó.';

-- Vista previa opcional (no modifica nada): clientes que se van a regularizar.
-- select c.codigo, c.nombre, c.membresia, s.cantidad as sellos, cfg.meta
-- from public.clientes c
-- join public.sellos s on s.cliente_id = c.id
-- cross join public.config cfg
-- where cfg.id = 1 and s.cantidad >= cfg.meta
-- order by s.cantidad desc, c.codigo;

-- Arregla los contadores atrasados ahora. El resultado es la cantidad de
-- tarjetas regularizadas; revisá los premios pendientes en Home.
select public.normalizar_sellos() as tarjetas_regularizadas;

notify pgrst, 'reload schema';
```

> **Por qué pasó:** el reinicio a 0 ocurre cuando el escáner registra la visita que llega a la meta, no cuando se cambia la meta en Configuración. Si la meta bajó de 8 a 5 (o si un contador se cargó a mano hasta la meta), los clientes que ya tenían 5, 6 o 7 sellos quedaron mostrando la meta hasta su próximo escaneo. La tabla además muestra `min(sellos, meta)`, así que un cliente con 6 sellos se veía como `5/5`. La función de arriba regulariza esos casos y Configuración la llama automáticamente cuando cambia la meta; el modal de edición también cierra el ciclo si el admin carga la meta a mano.
>
> Después de correr el `select`, revisá **Recompensas pendientes** en Home. Si alguno de esos clientes ya había canjeado su premio, marcalo como entregado para no darlo dos veces.

### Verificación
`tsc --noEmit` OK · `next build` OK · lint con los mismos 4 errores / 3 warnings preexistentes. Falta correr los dos bloques SQL y probar en Supabase: Home (tablas y gráficos), escaneo de un miembro (visita + sello + premio), tarjeta pública, registro, edición de sellos desde el modal y cambio de meta en Configuración (debe regularizar y dejar premios pendientes).

## 0b. Sesión 2026-11-06 — barra de búsqueda y filtros en Home + fecha de nacimiento

### Barra de búsqueda y filtros (Home)
- **La búsqueda manual salió de `/qr`**: se eliminó `components/qr/client-search.tsx` y `QrView` ya no recibe `origen` (la página tampoco resuelve `headers()`). En `/qr` quedan solo el QR, el formulario y el escáner.
- La barra nueva vive **al lado del banner de bienvenida**: `components/home/clientes-filtros.tsx` (`FiltrosClientesProvider` + `FiltrosClientesBar`). Es horizontal desde `xl` (banner `0.85fr` + barra `2.15fr`) y se apila en pantallas menores.
- Controles: **búsqueda en vivo** (nombre, correo, código y teléfono; ignora tildes y normaliza los dígitos del teléfono) + **Mes de registro** + **Mes de cumpleaños**. Filtran **las dos tablas** (todos los clientes y membresía) porque comparten `useFiltrosClientes()`.
- `ClientsTable` filtra con `coincide()`, vuelve a la página 1 al cambiar filtros y muestra un vacío propio cuando hay filtros activos.
- "Mes de registro" usa `clientes.created_at` (nuevo campo `creadoEl` en `Cliente`), convertido a la zona del salón con `mesDe()` (`lib/fechas.ts`).
- Resumen "Mostrando X de Y clientes" + botón "Limpiar filtros" que aparecen solo cuando hay filtros activos.
- Las opciones de los selects muestran el **conteo por mes** (`Enero · 3`) para que se vea de un vistazo qué meses tienen clientes. Si no hay ninguna fecha de nacimiento, el vacío de la tabla avisa "Todavía no hay fechas de nacimiento cargadas" y recuerda cargarlas desde Editar.

### Fecha de nacimiento (columna existente `cumpleanos`)
- **La tabla `clientes` ya tenía la columna `cumpleanos` (date).** No se crea ninguna columna nueva: Home lee `cumpleanos`, el registro y la edición guardan ahí. El campo de la app sigue llamándose `fechaNacimiento` internamente.
- En un intento anterior se creó por error `fecha_nacimiento` y su migración; **ambas se eliminaron**. El usuario debe correr `alter table public.clientes drop column if exists fecha_nacimiento;` en Supabase (ver conversación).
- `register-form.tsx`: los tres campos Día/Mes/Año tienen estado, validan una fecha real (31/02 y años futuros fallan) y guardan `cumpleanos` (opcional).
- `admin-acciones.tsx`: campo nativo `type="date"` en el modal de editar, guardando en `cumpleanos`. Arriba de los campos, el modal muestra un resumen **"Cumpleaños: 10 de mayo de 1990"** (o "Sin fecha cargada") que se actualiza en vivo al cambiar la fecha; se formatea a mano para que la zona horaria no corra el día.
- Los modales de editar y eliminar ahora usan el patrón `fixed inset-0 overflow-y-auto` + wrapper `flex min-h-full items-center justify-center p-4`: si el contenido es más alto que la ventana (desktop o móvil), **se puede scrollear** en vez de quedar cortado. El padding bajó a `p-5 sm:p-6` para ganar altura.
- Efecto extra: `ClientesSync` ya recibe `fechaNacimiento`, así que las notificaciones de cumpleaños empiezan a funcionar con los datos existentes.

### Verificación
`tsc --noEmit` 0 · `next build` OK · `impeccable detect` `[]` · lint 4 errores / 3 warnings preexistentes (nada nuevo). **Sin verificación visual**: el navegador desktop de la sesión estaba desconectado (`browser.disconnected`); falta que el usuario revise desktop y móvil.

## 0c. Sesión 2026-10-22 — deploy en Vercel y premios por correo

### Deploy
- Proyecto en Vercel conectado al repo de GitHub (`Davidjoel12/AfroBroccoli`, branch `main`). **Push a `main` = deploy automático**. Desde 2026-11-06 hay `vercel.json` con el cron de cumpleaños.
- Variables en Vercel (Settings → Environment Variables, y **Redeploy** después de cambiarlas): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` y `EMAIL_FROM` (solo nombre visible). Alternativas ya soportadas por código: `BREVO_API_KEY` o `RESEND_API_KEY` (esta última para cuando haya dominio propio). Para el cron se agregan `SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` (ver sección 0).
- Producción y local comparten el **mismo proyecto de Supabase**: los datos son los mismos. No hay base de datos de staging.

### Premios (reinicio de sellos + correo)
- `components/qr/camera-scanner.tsx`: al escanear, `nuevaCantidad = selloPrevio + 1`. Si llega a **meta - 1**, manda el aviso por correo (`/api/aviso`). Si llega a la meta, se guarda **0** (el ciclo reinicia y esa visita no cuenta para el ciclo nuevo) y se registra el premio pendiente; **ya no se manda correo automático**. La meta y la recompensa se leen **antes** de guardar (`config.meta` / `config.recompensa`; desde 2026-11-06 son las mismas para todos).
- `lib/premios.ts`: `nuevoFolio(codigo)` (formato `AB-1001-20261022-7F3K`), `construirCorreoAviso()` (aviso de "te falta 1 sello") y `construirCorreoCumpleanos()`. `construirCorreoPremio()` queda para un reenvío manual del comprobante.
- `lib/email.ts`: centraliza **Gmail SMTP** (`nodemailer`, `smtp.gmail.com:465`, `GMAIL_USER` + `GMAIL_APP_PASSWORD`), **Brevo** (`BREVO_API_KEY`) y **Resend** (`RESEND_API_KEY`). `EMAIL_FROM` solo aporta el **nombre visible** en Gmail; la dirección siempre es `GMAIL_USER`. Sin proveedor responde 503 `sin_configurar`.
- `app/api/aviso/route.ts`: `POST /api/aviso` envía el correo de 4 sellos y valida que `sellos === meta - 1`. `app/api/premio/route.ts` sigue existiendo para un reenvío manual del comprobante con folio.
- Si el cliente no tiene correo, el contador se reinicia igual y se muestra el aviso + botón de WhatsApp (decisión del usuario).
- **Premios pendientes (tabla `premios`) — implementado 2026-10-23.** Como el contador vuelve a 0, la notificación ya no se deduce de `sellos >= meta`. Al completar la meta el escáner inserta una fila en `premios` (folio, recompensa, meta, `membresia=false`; `correo_enviado` queda en su default porque desde 2026-11-06 no se manda correo al completar) y Home trae las pendientes (join a `clientes`) vía `PremiosSync` al provider. El panel muestra "Recompensa pendiente" con botón **Marcar como entregado** (`estado='entregado'`). ⚠️ **FALTA QUE EL USUARIO CORRA** `supabase/migrations/20261022000000_premios.sql` (Supabase → SQL Editor). Si no está corrida, la consulta de premios falla y la app sigue funcionando sin premios (no se rompe).

## 0d. Sesión 2026-10-18 — qué se hizo (leer primero)

Cinco pedidos del usuario, todos implementados:

1. **Tarjeta desde el punto de vista del cliente.** Nuevo componente compartido `components/card/tarjeta-cliente.tsx` (usado por la página real y por la vista previa de Configuración, así nunca se desincronizan). Nuevo campo `codigo` en `lib/types.ts` (`Cliente`) y en el `select` de Home. Nuevo botón "Abrir la tarjeta real ↗". El botón de **WhatsApp** de las dos tablas y de la búsqueda manual ahora manda: saludo + `Llevás X de Y sellos.` + link `/c/CODIGO`.
   - **Ruta pública `/c/[codigo]`** (`app/c/[codigo]/page.tsx` + `loading.tsx`): Server Component, sin login, lee con la función `tarjeta_cliente(codigo)` (RLS bloquea a `anon` en `clientes`). Datos con `React cache()` para no duplicar la consulta con `generateMetadata`. Copy siempre en español (lo lee la clienta, no la app).
   - `proxy.ts`: `/c/` entró a `RUTAS_PUBLICAS`.
   - El origen absoluto del sitio se resuelve **en el servidor** (`headers()` en `app/(app)/page.tsx` y `app/(app)/qr/page.tsx`) y se pasa por prop `origen`. **No** leer `window.location` durante el render: el `href` del servidor y el del cliente se desajustan (hydration mismatch).
1i. **Noveno pase del 18/10 — "No hay ningún cliente con el código AB-XXXX":**
   - El cliente **sí existía** (verificado calling `rpc/tarjeta_cliente` contra Supabase: devuelve `AB-6720`, Juan de los memos, 2/8 sellos). El bug era del escáner.
   - Causa: `registrarVisita()` usaba `.single()` y **nunca leía `error`**. `.single()` devuelve `data: null` tanto si no hay filas **como si hay más de una**, y cualquier error de RLS/red también terminaba en `data: null` → siempre "no encontrado". Era un mensaje mentiroso que tapaba la causa real.
   - Fix: `.limit(1)` + `data?.[0]`, y `error` se muestra al usuario + `console.error` con el código. Ahora la visita y el sello también chequean su error (antes se ignoraban igual).
   - Mismo fix aplicado a `ClientSearch` (`components/qr/client-search.tsx`): ignoraba `error`, así que una consulta denegada se veía igual que "no se encontraron clientes".
   - `console.info("[escaneo] filas para <código> → N")`: deja registro de cuántas filas volvió de verdad.
   - **Regla:** nunca usar `.single()` + ignorar `error` para decidir "no existe". Usar `.limit(1)` / `.maybeSingle()` y mirar el error.

1h. **Octavo pase del 18/10 — sin columna de Sellos + fix final de la cámara:**
   - **Sellos ya no es columna**: la barra amarilla + "X/Y sellos" quedó debajo del nombre/correo, como en móvil. `Sellos` ahora acepta `className`. Quedan 4 columnas (País, Cliente+sellos, Teléfono, Membresía, Acciones).
   - **Cámara (el bug era mío, no del navegador).** Passando el `deviceId` como primer argumento de `html5.start()` NO alcanza: si además se pasa `videoConstraints` válido, la librería **ignora por completo** el primer argumento (`esm/html5-qrcode.js` ~línea 148: `areVideoConstraintsEnabled ? internalConfig.videoConstraints : createVideoConstraints(cameraIdOrConfig)`). Con `videoConstraints` sin cámara, el navegador elegía la frontal.
   - Fix: `constraintsCamaraTrasera()` mete el `deviceId` **dentro** de `videoConstraints`. `configCamaraHtml5Qrcode()` queda solo para el caso sin `videoConstraints`.
   - **Para leer esto después:** si una librería ignora un parámetro, leer el código de la librería antes de seguir probando variantes.

1g. **Séptimo pase del 18/10 — WhatsApp pasa a la columna de acciones (desktop):**
   - Se eliminó la columna "WhatsApp" de las tablas de `clients-table.tsx`. Ahora hay una sola columna **Acciones** que agrupa el logo de WhatsApp + editar + eliminar (solo editar/eliminar si es admin).
   - Antes: 6-7 columnas, con scroll horizontal obligatorio a 1280px. Ahora: 5-6.
   - El header "Acciones" se muestra **siempre** (también para staff, que solo ve WhatsApp), para que la columna nunca quede sin rótulo.
   - El grupo es un `<div className="flex items-center justify-end gap-2">`, **no** un `<a>`: anidar enlaces rompe la navegación. `BotonWhatsapp` conserva su `target="_blank"`.
   - ⚠️ La clave `"WhatsApp"` del diccionario sigue usándose en `client-search.tsx`, no se borró.

1f. **Sexto pase del 18/10 — el escáner abría la cámara FRONTAL:**
   - Causa: `facingMode: "environment"` es una restricción **ideal** (una sugerencia), no exacta. El navegador la ignora cuando puede y abre la que quiere.
   - Fix: `lib/camara.ts` con `detectarCamaraTrasera()`, `abrirCamaraTrasera()` y `configCamaraHtml5Qrcode()`. Pide un stream de sondeo (**sin esto `enumerateDevices()` devuelve los labels vacíos**), mira qué cámara le dieron, y si hay otra etiquetada como trasera (`back|rear|environment|traser|posteri|trase`) usa **ese `deviceId` exacto**. Cierra el stream de sondeo en `finally`.
   - Las dos rutas lo usan: `abrirCamaraTrasera()` para BarcodeDetector, `configCamaraHtml5Qrcode()` para html5-qrcode (que no acepta MediaTrackConstraints: hay que darle `{deviceId:{exact}}` o `{facingMode:"environment"}` plano).
   - Si el deviceId adivinado falla, `abrirCamaraTrasera` reintenta con `facingMode: {ideal:"environment"}` para no romper el escáner.
   - Probado con `node --experimental-strip-types tools/probar-camara.mjs` (mocks de `navigator.mediaDevices`).

1e. **Quinto pase del 18/10 — crash del escáner + lectura más rápida** (bug reportado por el usuario con captura del overlay de Next.js):
   - **Crash "Cannot stop, scanner is not running or paused."** En `html5-qrcode`, `stop()` **lanza de forma síncrona** (`throw "..."`) cuando el lector no está activo, aunque el `.d.ts` lo declare `Promise<void>`. Por eso `html5.stop().catch(() => {})` no atrapaba nada: la excepción se escapaba al evaluar `stop()`, antes de adjuntar el `.catch`. Además el lector se paraba **dos veces** (al leer el código y al desmontar el componente) y la segunda siempre fallaba. Fix: `detenerHtml5()` toma la referencia, la anula y envuelve en `try/catch`. Verificado con `node tools/probar-stop-qr.mjs` (stub mínimo de `document`/`window`).
   - **Lectura más rápida**: `fps` 10 → **25**; caja fija de 250 px → **adaptativa** al 78% del lado menor de la pantalla; `videoConstraints` 1280×720; y en el camino de `BarcodeDetector` el sondeo bajó de 500 ms a **200 ms** con guarda `detectando` para no apilar `detect()`.
   - **El túnel de desarrollo NO hace lento el reconocimiento**: el análisis del QR es 100% local al dispositivo. El túnel afecta la carga de la página y las llamadas a Supabase, que es otro síntoma.
   - `detener` y `detenerHtml5` ahora son `useCallback` para no dejar el warning de `exhaustive-deps` (la base de lint queda en 4 errores / 4 warnings, los mismos previos).

1d. **Cuarto pase del 18/10 — QR de la tarjeta más fácil de escanear:**
   - `TarjetaCliente`: QR de **64 px → 96 px** (`h-24 w-24`, tile `p-2`).
   - `margin: 1 → 4` (el margen de silencio que pide la norma ISO; el lector lo usa para detectar dónde arranca el código). Antes el código ocupaba el 94% del ancho y no había aire alrededor.
   - `width: 200 → 384` para que los módulos salgan nítidos en pantallas retina. `errorCorrectionLevel: "M"` explícito.
   - Medido con `node tools/medir-qr.mjs` (script que quedó en el repo): la URL de la tarjeta da siempre un QR **v3 (29×29)**; a 96 px queda **3.31 px por módulo** vs 2.21 px antes. Ojo: en `qrcode`, `modules.size` es el código **sin** el margen, el margen se dibuja aparte.
   - ⚠️ `components/qr/my-qr-card.tsx` (el QR de registro que escanea la clienta) tiene el mismo `margin: 1`. Queda pendiente, no se tocó por no salir del pedido.

1c. **Tercer pase del 18/10** (segunda tanda de la revisión):
   - **El switch ES/EN no traducía la tarjeta pública.** No era el switch: la página y el componente tenían el texto en español **hardcodeado** y nunca llamaban a `t()`. Ahora `TarjetaCliente` usa `useT()`, y lo que se ve vive en `components/card/tarjeta-publica.tsx` (Client Component) porque `app/c/[codigo]/page.tsx` es Server Component y no puede leer el idioma. **Regla para lo que viene: todo texto visible va con `t()`; si la página es Server Component, el texto se baja a un Client Component.**
   - `app/registro/page.tsx` tenía el mismo defecto → ahora es Client Component y traduce.
   - **Editar/borrar en la búsqueda de `/qr`**: `ClientSearch` trae `pais` + `sellos(cantidad)`, lee la config para calcular `metaSellos` y monta `AdminAcciones` (solo admin). `AdminAcciones` ahora acepta `ClienteEditable` (un `Pick` de `Cliente`) y llama `onChanged(accion, clienteId)`: al guardar re-consulta la búsqueda, al borrar saca la fila. En Home sigue refrescando con `router.refresh()` como antes.

1b. **Ajustes de la revisión del 18/10** (pedidos del usuario sobre lo anterior):
   - La vista previa de Configuración **ya no consulta clientes**: quedó fija con `EJEMPLO = { nombre: "Swanny", codigo: "AB-0000", sellos: 2 }` en `card-customizer.tsx`. `AB-0000` está fuera del rango que genera el registro (`AB-1000`–`AB-9999`), así que ese QR nunca lleva a una tarjeta real. Se fue el `useMemo`, el dropdown y el `select`.
   - **Autoregistro redirige a la tarjeta**: `RegisterForm` tiene `redirigir`, activo **solo en `/registro`** (público). Tras guardar, muestra el código ~900 ms y empuja a `rutaTarjeta(codigo)`. En `/qr` **no** redirige: el staff necesita quedarse para seguir registrando.
2. **~~Metas separadas por tipo de cliente.~~ (reemplazado 2026-11-06).** Ahora hay **una sola tarjeta de sellos** para todos: `lib/config.ts` solo maneja `meta`, `recompensa`, `colorAcento` y `logoUrl`. Los miembros usan la misma meta y recompensa que los regulares; la membresía es una suscripción mensual aparte.
   - ⚠️ **FALTA QUE EL USUARIO CORRA** `supabase/migrations/20261018090000_metas_por_tipo_y_tarjeta_publica.sql` (Supabase → SQL Editor). Hasta entonces la app **no se rompe**: `leerConfigTarjeta` reintenta con las columnas viejas y `guardarConfigTarjeta` devuelve `parcial: true` (la UI muestra un aviso ámbar, no un error).
3. **Bug de las pills de `/qr` en inglés.** Causa: el estado guardaba la etiqueta ya traducida (`"Form"`) y la comparación contra `"Formulario"` fallaba → siempre caía en QR-Cámara. Arreglo de raíz: `PillTabs` ahora recibe `tabs: { id, label }[]` (`id` estable = español, `label` = traducido) y `qr-view.tsx` guarda el `id`.
4. **Separación de clientes en la tabla (móvil).** Un solo divisor: `divide-ink/15` entre clientes, **fuera** el `border-t border-ink/10` que separaba los botones editar/eliminar (ese era el segundo gris que confundía). Mismo escalón en el encabezado y en la paginación.
5. **Redirección a `/login` al navegar.** `proxy.ts` usaba `supabase.auth.getUser()`, que hace **un request de red a Supabase Auth en cada navegación** (RSC, prefetch, etc.); con el rate limit de Auth eso devuelve `user: null` y el proxy expulsaba a la gente. Ahora usa **`supabase.auth.getClaims()`**, que valida el JWT contra el JWKS (el proyecto usa llaves asimétricas EC/ES256) sin pegarle a `/auth/v1/user`. En el log del server el proxy pasó deKb→ **~3 ms por request**.

Extras de esta tanda: `eslint.config.mjs` tenía `import "taildwindcss"` (typo) y **`npm run lint` no arrancaba**; corregido. Ahora lint corre y quedan **4 errores preexistentes** (`react-hooks/set-state-in-effect`) en `components/config/profile-form.tsx` (×2), `components/i18n/language-provider.tsx` y `components/ui/logo.tsx` + 4 warnings: **no los toqué** (fuera de alcance), el código nuevo no suma ninguno.

Verificación: `tsc --noEmit` limpio · `next build` OK · `impeccable detect` → `[]`. **No se pudo verificar visualmente**: el navegador de la sesión estaba desconectado (`browser.disconnected`) y no hay herramienta de resize, así que el usuario tiene que revisar móvil.

## 1. Proyecto y fase
- App web **interna de gestión para salón de belleza "AfroBroccoli"**. Fase actual: **SOLO FRONTEND con datos mock**. El backend viene después de terminar todas las pantallas: **Supabase** (DB + auth) y **Vercel** (deploy).
- Objetivo: reproducción **fiel al Figma** (desktop + móvil) de: Home, Código QR, Configuración y Login. Las capturas que manda el usuario son la verdad visual.
- Pantallas que NO existen en Figma (forgot-password, estados de cámara/búsqueda/validación, "Personalizar tarjeta") las diseñó el asistente y se marcan como **"fuera de Figma"**.
- **Fase G es la única pendiente** (ver §8).

## 2. Stack
- Next.js **16.3.4** App Router + React **19** + TypeScript + **Tailwind v4** (`@theme` en `app/globals.css`). AGENTS.md exige leer `node_modules/next/dist/docs/` antes de escribir código Next.
- Dependencias añadidas: `chart.js`, `react-chartjs-2`, `flag-icons`, `qrcode` + `@types/qrcode`, `tailwind-merge`.
- Instalar con `npm.cmd`. Typecheck: `node node_modules/typescript/bin/tsc --noEmit` (shell Windows sin `head`/`ls`/`tail`; usar `/usr/bin/ls`).
- Repo **sin commits aún** (`master` sin commits; scaffold staged + trabajo propio untracked). No borrar cambios ajenos.

## 3. Rutas y estructura de carpetas
- Rutas: `/` · `/qr` · `/configuracion` · `/configuracion/personalizar-tarjeta` · `/login` · `/registro` · **`/c/[codigo]` (pública, sin login)**.
- `app/(app)/layout.tsx` = shell compartido: `<AppNav />` + `<main className="flex-1 px-4 py-6 lg:px-8">` (sin max-width).
- Carpetas: `components/<dominio>/` → `ui`, `nav`, `home`, `qr`, `config`; `lib/` en raíz (**NO** `app/ui`).
- Existe `app/demo/` (basura, limpiar en Fase G). `app/page.tsx` original ya fue borrado.

## 4. Design tokens (`app/globals.css` → `@theme`)
- `cream #FFF8EE` (fondo) · `ink #221B19` · `muted #6B5F5A` · `muted-nav #BDB3AD` · `primary #6FC22D` (verde) · `accent #FF66C4` (rosa) · `gold #FFD700` · `mint #85D2CA` · `danger #E23650` · `pending`.
- `--radius-card: 20px` · `--radius-button: 10px` (valores puestos por el usuario).
- **Tipografía**: Inter (cuerpo) + 7 script fonts de Google cargadas en `fonts.ts`: Caveat, Dancing_Script, Pacifico, Satisfy, Kaushan_Script, Great_Vibes, Alex_Brush. La activa se cambia en `app/globals.css` **línea ~31** (`--font-script: ...`). ⚠️ **PENDIENTE: el usuario elige la definitiva** (logo/nombre/nav usan `font-script`).
- Patrón de ítem activo: verde claro `bg-primary/15` + texto/borde `primary`.

## 5. Componentes UI (`components/ui/`)
- `button.tsx`: variantes `primary` (verde), `accent` (rosa), `subtle` (blanco), `outline`, `ghost`; base `h-11 rounded-button px-6 font-semibold`; exporta `buttonVariants()`. Overrides vía `className`.
- `card.tsx`: `rounded-card border border-ink/15 bg-white p-6 shadow-sm`.
- `input.tsx`: `Field` (label wrapper) + `Input` (`h-11 rounded-lg border-ink/20 bg-white/50 px-5`, focus primary).
- `pill-tabs.tsx`: pills; activo = `border-ink/15 bg-white text-primary`.
- `lib/utils.ts`: `cn()` con **twMerge** → overrides como `p-8`, `bg-ink`, `h-10` ganan a los defaults (clave para no reventar estilos).

## 6. Pantallas (todas construidas)
### Login — `app/login/` (`page.tsx` + `login-form.tsx`)
- Estados: error, loading, forgot-password. Logo con `next/image src="/logo.jpg"`.
- **Mock: `martha@afrobroccoli.com` / `afro123`**. **Rol se detecta automáticamente — NO hay selector de rol en la UI.**

### Nav — `components/nav/app-nav.tsx`
- Desktop: topnav oscura (ink) Home / Código QR / Configuración; activo con **subrayado verde**.
- Móvil: header hamburguesa + logo script + campana de notificaciones (placeholder con badge, **sin lógica aún**). Drawer animado **desde arriba**, ancho por contenido (`min-w-[220px]`), respeta `prefers-reduced-motion`.

### Home — `app/(app)/page.tsx`
- `metric-card`, `charts.tsx` (VisitsChart barras + DistributionChart doughnut con Chart.js/react-chartjs-2), y **DOS tablas de clientes: regulares + membresía**.
- Columnas: bandera nacionalidad redondeada (flag-icons, 32px vía style inline), nombre+email, conteo de sellos (barra de progreso), teléfono, botón **WhatsApp** (link wa.me).
- Mock en `lib/data.ts`, tipos en `lib/types.ts`. Contenedores de chart: `relative h-64 w-full` / `h-55 w-full` + `min-w-0` en columnas de grilla.

### QR — `app/(app)/qr/page.tsx`
- Desktop 2 columnas / móvil pills **"Formulario" | "QR-Cámara"**.
- `components/qr/`:
  - `my-qr-card.tsx`: QR real (`QRCode.toDataURL`), botón descargar.
  - `register-form.tsx`: formulario de registro.
  - `client-search.tsx`: título con **caja amarilla `bg-gold`** + lupa; input `flex-1 min-w-0` (llena la card, clave en móvil), botón `Buscar` con `whitespace-nowrap`.
  - `camera-scanner.tsx`: cabecera horizontal = **caja verde `bg-primary` con icono cámara + título + botón rosa "→ Iniciar"** (al estilo Figma); estados `idle | camera | exito | error | no-soportado`; escaneo con **`BarcodeDetector` nativo** (Chrome/Edge + localhost/HTTPS; fallback a búsqueda manual). El video/estados van debajo de la cabecera.
- Bug ya corregido: móvil se desbordaba por falta de `min-w-0`/`flex-1`.

### Configuración — `app/(app)/configuracion/` (rediseñada al Figma en la última tanda)
- `layout.tsx`: grilla **`lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8`**; columna izq = `<h1 className="text-3xl font-bold">Configuración</h1>` + `ConfigNav`; columna der = contenido (**sin max-w**).
- `components/config/config-nav.tsx` (client):
  - **Desktop (lg+)**: `<aside>` tarjeta blanca (`rounded-card bg-white p-2 shadow-sm`, col de 240px) con 2 items:
    1. **"Perfil"** (activo): `bg-primary/15 text-ink` + **barra verde izquierda** (`absolute left-0 inset-y-1.5 w-1.5 rounded-r-full bg-primary`) + icono **sello festoneado con check** (Tabler `rosette-discount-check`, path SVG embebido, stroke-2, 18px).
    2. **"Personalizar tarjeta"**: `text-ink/80` + icono **rodillo** (Lucide `paint-roller`). Ambos paths SVG van dentro del arreglo `ITEMS`.
  - **Móvil (<lg)**: pills `flex-wrap bg-white border`; activa `border-primary/40 text-primary`; inactiva `border-ink/15 text-ink`. **Sin iconos** (igual que el modelo móvil).
  - Label unificado = **"Perfil"** (el Figma desktop dice "Logo"; el usuario decidió unificar en "Perfil"; mantenerlo).
- `page.tsx` → `components/config/profile-form.tsx`:
  - `Card className="p-6 sm:p-8"`; h2 "Perfil" `text-2xl`; subtítulo **"Actualiza tus datos de la empresa"** `text-base`. **NO agregar "Fecha de nacimiento"** (decisión del usuario).
  - Logo `public/logo.jpg`: `h-24 w-24` (móvil) → `sm:h-36` → **`lg:h-44 lg:w-44` (176px, tamaño Figma)**, `rounded-card object-cover`.
  - Fila logo+botones: `flex flex-wrap items-center gap-3 sm:gap-4`; contenedor de botones `flex min-w-[168px] flex-1 flex-col gap-2 sm:w-56 sm:flex-none` → en móvil los botones quedan AL LADO del logo (o se apilan si no entra), en desktop ancho fijo. Botones: "Subir nueva imagen" (`Button !h-10 w-full whitespace-nowrap`) y "Eliminar avatar" (`h-10 w-full`, outline). **Mismo ancho → bordes alineados**.
  - Form `grid gap-5`; nombre+correo `sm:grid-cols-2`; teléfono full; **"Guardar cambios" `w-full` SIEMPRE** (submit, estado mock `guardado` → ✅).
- `personalizar-tarjeta/page.tsx` → `components/config/card-customizer.tsx` (**pantalla diseñada por el asistente, "fuera de Figma"**, al usuario le gustó):
  - Controles: **Color de acento** (swatches: Rosa `#FF66C4`, Verde `#6FC22D`, Dorado `#FFD700`, Menta `#85D2CA`) · **"Recompensas"** (antes "Lema de la tarjeta"; default `1 servicio gratis`; ayuda: «Aparece en la tarjeta como "por completar X sellos"») · **"Meta de sellos"** select 4/5/8/10. Botón "Guardar y aplicar".
  - ⚠️ **Bug ya corregido**: cada `<option>` DEBE llevar `value={m}`; sin eso el value es `"5 sellos"` → `Number()` = `NaN` → los círculos de la vista previa desaparecen.
  - Vista previa: tarjeta ink `#221B19` `rounded-[20px]`: barra de acento, "AfroBroccoli" (`font-script`), recompensa, **sellos** (`flex-wrap`, `completados = Math.min(3, sellos)`), "Por completar {meta} sellos", y **QR único del cliente** abajo-derecha (`QRCode.toDataURL("https://app.afrobroccoli.com/c/AB-0042")` en mosaico blanco, caption "Código único del cliente · AB-0042"). `CODIGO_CLIENTE`/`QR_URL` = **mock; el backend lo reemplaza**.

## 7. Verificación y flujo de trabajo (NO omitir)
- Tras cada tanda de edits UI: `.agents/skills/impeccable/scripts/impeccable.cmd detect --json <archivos cambiados>` (Windows → `.cmd`); debe salir `[]`.
- Antes de tocar UI: leer `.agents/skills/impeccable/reference/craft-floor.md`. El comando `impeccable context` **ya corrió** en la sesión (no repetir); no existe PRODUCT.md (init es opcional, no bloquea).
- Tras cambios: `node node_modules/typescript/bin/tsc --noEmit` debe dar 0.
- **Navegador de pruebas: SOLO `http://localhost:3000`** (la IP LAN rompe el websocket de HMR → JS muerto, botones inertes). En la última sesión el navegador desktop conectado estaba **desconectado** (`browser.disconnected`): la verificación visual la hizo el usuario con capturas.
- Iterar en tandas acotadas (build → 1 ronda de capturas → corregir todo junto → máximo 1 ronda de confirmación).

## 8. Pendientes (para la Fase G y después)
1. ~~Fase G~~ — **completada** (revisada con skeletons, demo eliminado, build OK, repo en GitHub main).
2. **Elegir la font script definitiva** (`--font-script`, globals.css ~línea 31; 7 candidatas cargadas).
3. Opcionales: `impeccable init` (PRODUCT.md), guardar patrones en `.interface-design/system.md`, activar hooks de impeccable.
4. ~~Tras G: backend~~ → backend planificado en §10. **Estado: Fase G completada, repo en GitHub (main), queda empezar backend.**

## 9b. Backend — plan acordado (v2, 2026-10-06, en planificación, sin código aún)
- **Supabase** (DB + Auth) + **Vercel** (deploy). Free tier: pedir upgrade Pro cuando el salón lo use en serio (se pausa tras inactividad).
- **Roles**: `admin` y `staff` (sin selector en UI; rol se lee de `profiles` tras login).
  - **admin**: ver todo, registrar clientes, editar/eliminar clientes, editar meta y personalización de tarjeta.
  - **staff**: registrar clientes (manual en QR), sumar visita/sello escaneando QR, reenviar tarjeta por WhatsApp, buscar clientes. NO edita meta ni edita/elimina clientes.
- **Tablas**:
  ```sql
  profiles  id uuid pk references auth.users, nombre, role check in ('admin','staff'), created_at
  clientes  id uuid pk, codigo text unique (ej 'AB-0042'), nombre, email, telefono, pais,
            membresia boolean default false, created_at
  visitas   id, cliente_id FK, created_at        -- para filtro "más frecuentes"
  sellos    cliente_id PK FK, cantidad, updated_at
  config    fila única: meta int default 5, color_acento, recompensa  -- editable solo admin
  ```
- **Meta de sellos fija en 5** por defecto, editable solo por admin y **persistida en Supabase** (no localStorage) desde `configuracion/personalizar-tarjeta`.
- **Flujo central**: staff escanea QR → busca `clientes.codigo` → si existe, inserta visita y `sellos + 1` automático; si no existe, opción de registrar en el momento. Si el cliente no trae tarjeta: buscarlo en Home o en "Búsqueda de cliente manual" de QR y reenviar tarjeta por WhatsApp (wa.me).
- **UI por hacer en backend**: columnas Editar/Eliminar (solo admin) en ambas tablas de Home; filtros "más frecuentes" y "más sellos" en ambas tablas; personalizar-tarjeta persistido en Supabase.
- **RLS** en todas las tablas; staff: lectura + update de `sellos.cantidad`; admin: todo. Anon key en frontend, service role nunca.
- **Orden de ejecución**: 1) crear proyecto Supabase (URL + anon key), 2) migraciones SQL + RLS, 3) `@supabase/supabase-js` + `lib/supabase.ts`, 4) reemplazar mocks pantalla por pantalla (login → QR → Home → Configuración), 5) deploy Vercel con env vars.
- Meta/sellos mock actual en `lib/data.ts`, tipos en `lib/types.ts`.
- **Migraciones**: quedan en `supabase/migrations/` (empieza en `20261018090000_metas_por_tipo_y_tarjeta_publica.sql`). No hay CLI de Supabase ni service role key en el repo: **el usuario corre el SQL a mano en Supabase → SQL Editor**.
- **Estado (2026-10-06)**: IMPLEMENTADO el MVP esencial — migraciones en Supabase, login real + proxy que protege rutas, logout en nav, perfil real en Configuración, Home con datos reales (métricas, tablas, serie de visitas, distribución), registro de clientes con membresía, escáner QR que suma visita+sello, búsqueda manual, toggle de membresía solo admin (Home y QR), filtros por sellos/frecuentes/A–Z en ambas tablas, meta global persistida en `config` (editable solo admin). Pendiente: elegir font script definitiva, deploy Vercel.

## 9. Cómo continuar
- Responder en español, fidelidad al Figma, respetar decisiones del usuario (etiquetas "Perfil", subtítulo "de la empresa", sin fecha de nacimiento, guardar/auto-detectar rol).
- Primer mensaje sugerido: leer este archivo y ejecutar la Fase G §8.1.
