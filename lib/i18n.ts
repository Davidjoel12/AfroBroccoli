// i18n liviano: el español es la fuente de verdad.
// El diccionario `en` traduce cada cadena; si falta una, se muestra el español.
// Así no hay que inventar claves y el copy en español queda siempre legible en el código.

// prettier-ignore
export const DICCIONARIO_EN: Record<string, string> = {
  // ===== Navegación =====
  "Home": "Home",
  "Código QR": "QR Code",
  "Configuración": "Settings",
  "Salir": "Log out",
  "Cerrar sesión": "Log out",
  "Notificaciones": "Notifications",
  "Abrir menú": "Open menu",
  "Cerrar menú": "Close menu",
  "AfroBroccoli": "AfroBroccoli",

  // ===== Login =====
  "Gestión interna de clientes, sellos y equipo.": "Internal management of clients, stamps and team.",
  "Iniciar sesión": "Log in",
  "Entrá con tu cuenta del equipo": "Log in with your team account",
  "Correo o contraseña incorrectos. Verificá e intentá de nuevo.":
    "Wrong email or password. Check them and try again.",
  "Correo electrónico": "Email",
  "Contraseña": "Password",
  "¿Olvidaste tu contraseña?": "Forgot your password?",
  "Entrar": "Log in",
  "Entrando…": "Logging in…",
  "Tu rol se detecta automáticamente al iniciar sesión":
    "Your role is detected automatically when you log in",
  "Recuperar contraseña": "Reset password",
  "Escribí tu correo y te enviamos un enlace para restablecerla.":
    "Enter your email and we'll send you a reset link.",
  "Enviar enlace": "Send link",
  "Volver a iniciar sesión": "← Back to log in",
  "✅ Listo. Revisá tu correo: te enviamos el enlace para restablecer tu contraseña.":
    "✅ All set. Check your inbox: we sent you the link to reset your password.",

  // ===== Registro público =====
  "Registrate para obtener tu tarjeta de cliente":
    "Sign up to get your client card",

  // ===== Home =====
  "Bienvenida de vuelta,": "Welcome back,",
  "Clientes Totales": "Total clients",
  "Visitas hoy": "Visits today",
  "Sellos Totales": "Total stamps",
  "Acciones rápidas": "Quick actions",
  "Escanear QR de cliente": "Scan a client QR",
  "Ver mi QR de registro": "See my sign-up QR",
  "Distribución de clientes": "Client distribution",
  "Visitas": "Visits",
  "Regulares": "Regular",
  "Membresía": "Membership",
  "Clientes regulares": "Regular clients",
  "Clientes membresía": "Membership clients",
  "día": "day",
  "dia": "day", // valor real de Periodo (sin tilde)
  "semana": "week",
  "mes": "month",

  // ===== Tablas =====
  "Ordenar": "Sort",
  "Página": "Page",
  "de": "of",
  "A–Z": "A–Z",
  "Más sellos": "Most stamps",
  "Más frecuentes": "Most frequent",
  "País": "Country",
  "Cliente": "Client",
  "Sellos": "Stamps",
  "Teléfono": "Phone",
  "WhatsApp": "WhatsApp",
  "Acciones": "Actions",
  "No hay clientes en esta categoría.": "No clients in this category.",
  "Editar": "Edit",
  "Eliminar": "Delete",
  "Hacer miembro": "Make member",
  "Quitar membresía": "Remove membership",
  "Guardando…": "Saving…",
  "Enviar tarjeta de": "Send card of",

  // ===== Acciones de admin =====
  "Editar cliente": "Edit client",
  "Los cambios se guardan al instante.": "Changes save instantly.",
  "Nombre completo": "Full name",
  "Sellos acumulados": "Accumulated stamps",
  "Cancelar": "Cancel",
  "Guardar cambios": "Save changes",
  "Eliminar cliente": "Delete client",
  "Sí, eliminar": "Yes, delete",
  "Eliminando…": "Deleting…",
  "Vas a eliminar a": "You're about to delete",
  "junto con su historial de visitas y sellos. Esta acción no se puede deshacer.":
    "along with their visit and stamp history. This can't be undone.",

  // ===== QR =====
  "Comparte este QR para registrarse": "Share this QR to sign up",
  "Descargar QR": "Download QR",
  "Cargando QR…": "Loading QR…",
  "Escanear de nuevo": "Scan again",
  "Reintentar": "Retry",
  "Volver": "Back",
  "✅ QR leído:": "✅ QR read:",
  "No se pudo acceder a la cámara. Verificá los permisos o probá en otro navegador.":
    "Couldn't access the camera. Check permissions or try another browser.",
  "QR de AfroBroccoli": "AfroBroccoli QR",
  "Iniciar Cámara para escanear QR": "Start camera to scan QR",
  "Iniciar": "Start",
  "Detener": "Stop",
  "Formulario": "Form",
  "QR-Cámara": "QR-Camera",
  "Búsqueda manual de clientes": "Manual client search",
  "Buscar": "Search",
  "Buscando…": "Searching…",
  "Formulario para registrar clientes": "Client registration form",
  "Completá tus datos para crear tu cuenta y obtener tu QR.":
    "Fill in your details to create your account and get your QR.",
  "Registrar y obtener QR": "Register and get QR",
  "Registrando…": "Registering…",
  "Código de país": "Country code",
  "Número de teléfono": "Phone number",
  "Fecha de Nacimiento": "Date of birth",
  "Nacionalidad": "Nationality",
  "Cliente con membresía": "Membership client",
  "✅ ¡Cliente registrado! Ya puede escanear el QR para entrar.":
    "✅ Client registered! They can now scan the QR to check in.",
  "Acepto el tratamiento de datos personales según la ley 81 de Panamá.":
    "I agree to the personal data treatment under Panama's Law 81.",
  "No se pudo registrar. Verificá los datos e intentá de nuevo.":
    "Couldn't register. Check the details and try again.",
  "✅ ¡Listo! Este es tu código de cliente. Te llevamos a tu tarjeta.":
    "✅ All done! Here's your client code. Taking you to your card.",
  "Ver mi tarjeta ahora ↗": "See my card now ↗",
  "Código": "Code",
  "Día": "Day",
  "Mes": "Month",
  "Año": "Year",
  "No se encontraron clientes para": "No clients found for",
  "No se pudo buscar. Revisá tu conexión e intentá de nuevo.":
    "Couldn't search. Check your connection and try again.",
  "Verificá el nombre, teléfono o correo.": "Check the name, phone or email.",
  "Buscar por nombre, teléfono o correo": "Search by name, phone or email",
  "Este navegador no soporta escaneo nativo de QR (BarcodeDetector). Usá Chrome/Edge en móvil, o la búsqueda manual.":
    "This browser doesn't support native QR scanning. Use Chrome/Edge, or the manual search.",

  // ===== Configuración =====
  "Perfil": "Profile",
  "Actualiza tus datos de la empresa": "Update your business details",
  "Subir nueva imagen": "Upload new image",
  "Eliminar avatar": "Remove avatar",
  "Subiendo…": "Uploading…",
  "Rol:": "Role:",
  "✅ Cambios guardados correctamente.": "✅ Changes saved successfully.",
  "Administrador": "Admin",
  "Staff": "Staff",
  "Personalizar tarjeta": "Customize card",
  "Color de acento": "Accent color",
  "Recompensas": "Rewards",
  "Meta de sellos": "Stamp goal",
  "Guardar y aplicar": "Save and apply",
  "Los datos del negocio los administra el administrador del salón. Preguntale a la dueña si necesitás cambiar algo.":
    "Business details are managed by the salon admin. Ask the owner if you need something changed.",
  "Tu nombre": "Your name",
  "Tu correo": "Your email",
  "Elegí el color de acento y la recompensa de tu programa. Cada tipo de cliente tiene su propia meta de sellos.":
    "Pick your accent color and your rewards. Each client type has its own stamp goal.",
  "✅ Tarjeta de cliente actualizada.": "✅ Client card updated.",
  "No se pudieron guardar los cambios. Intentá de nuevo.":
    "Couldn't save the changes. Try again.",
  "Se guardó, pero falta aplicar la migración en Supabase para poder separar la meta y la recompensa de los clientes miembros.":
    "Saved, but the Supabase migration is still missing, so the member clients' goal and reward can't be split yet.",
  "Solo el administrador puede modificar la tarjeta. Estás viendo la configuración actual.":
    "Only the admin can modify the card. You're seeing the current settings.",
  "Ej. 1 servicio gratis": "E.g. 1 free service",
  "Clientes miembros": "Member clients",
  "Así ve su tarjeta el cliente": "This is how the client sees their card",
  "Es la misma tarjeta que el cliente abre desde el link de WhatsApp.":
    "This is the exact card the client opens from the WhatsApp link.",
  "Tarjeta de ejemplo con datos ficticios. La de cada cliente se arma sola con su nombre, su código y sus sellos.":
    "Example card with made-up details. Each client's is built automatically from their name, code and stamps.",
  "Máximo": "Max",
  "meta definida en Configuración": "goal set in Settings",

  // ===== Tarjeta del cliente (pública) =====
  "Miembro": "Member",
  "Tu código único": "Your unique code",
  "Por completar": "To complete",
  "¡Recompensa lista! Passé por el salón a canjearla.":
    "Your reward is ready! Stop by the salon to redeem it.",
  "Tu tarjeta de cliente": "Your client card",
  "No encontramos esa tarjeta": "We couldn't find that card",
  "Revisá el link que te pasamos o pedile al salón que te lo reenvíe.":
    "Check the link we sent you, or ask the salon to send it again.",
  "Mostrá este código en el salón para sumar tus sellos.":
    "Show this code at the salon to add your stamps.",
  "sello": "stamp",
  "sellos": "stamps",
};

export type Idioma = "es" | "en";