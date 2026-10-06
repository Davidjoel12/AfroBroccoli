# HANDOFF — AfroBroccoli (sesión 2026-10-03 → 2026-10-06)

> Prompt de continuidad para otra IA. Leer completo antes de trabajar. Idioma de la UI y de la conversación: **español** (voseo en el copy: "Elegí", "Verificá", "Apuntá").

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
- URLs limpias vía route group: `/` · `/qr` · `/configuracion` · `/configuracion/personalizar-tarjeta` · `/login` (sin prefijo `/dashboard`).
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

## 9. Cómo continuar
- Responder en español, fidelidad al Figma, respetar decisiones del usuario (etiquetas "Perfil", subtítulo "de la empresa", sin fecha de nacimiento, guardar/auto-detectar rol).
- Primer mensaje sugerido: leer este archivo y ejecutar la Fase G §8.1.
