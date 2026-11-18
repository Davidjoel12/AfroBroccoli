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
  "Visitas regulares": "Regular visits",
  "Visitas de miembros": "Member visits",
  "Sin membresía": "Without membership",
  "Con membresía": "With membership",
  "Clientes": "Clients",
  "Clientes regulares": "Regular clients",
  "Clientes membresía": "Membership clients",
  "día": "day",
  "dia": "day", // valor real de Periodo (sin tilde)
  "semana": "week",
  "mes": "month",

  // ===== Filtros de clientes (Home) =====
  "Buscar cliente": "Search client",
  "Nombre, teléfono, correo o código": "Name, phone, email or code",
  "Limpiar búsqueda": "Clear search",
  "Mes de registro": "Sign-up month",
  "Mes de cumpleaños": "Birthday month",
  "Todos": "All",
  "Mostrando": "Showing",
  "clientes": "clients",
  "Limpiar filtros": "Clear filters",
  "Ningún cliente coincide con los filtros.": "No clients match the filters.",
  "Probá con otro nombre, mes o limpiá los filtros.":
    "Try another name or month, or clear the filters.",
  "Todavía no hay fechas de nacimiento cargadas.":
    "There are no birth dates on file yet.",
  "Agregá la fecha desde el botón Editar de cada cliente.":
    "Add it from each client's Edit button.",
  "No hay fechas de registro para filtrar.":
    "There are no sign-up dates to filter by.",
  "Enero": "January",
  "Febrero": "February",
  "Marzo": "March",
  "Abril": "April",
  "Mayo": "May",
  "Junio": "June",
  "Julio": "July",
  "Agosto": "August",
  "Septiembre": "September",
  "Octubre": "October",
  "Noviembre": "November",
  "Diciembre": "December",

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
  "Hacer miembro (sigue acumulando sellos)": "Make member (they keep earning stamps)",
  "Quitar membresía (sigue como cliente regular)": "Remove membership (they remain a regular client)",
  "No se pudo actualizar la membresía. Revisá que el SQL de Miembros esté corrido.":
    "The membership couldn't be updated. Check that the Members SQL has been run.",
  "Guardando…": "Saving…",
  "Enviar tarjeta de": "Send card of",

  // ===== Acciones de admin =====
  "Editar cliente": "Edit client",
  "Editar sellos": "Edit stamps",
  "Editar sellos de": "Edit stamps of",
  "Ajustá manualmente los sellos acumulados. El resto de los datos solo lo edita el administrador.":
    "Manually adjust accumulated stamps. Only the admin can edit the rest of the details.",
  "No se pudo generar el premio. Los sellos no se modificaron.":
    "The reward couldn't be created. Stamps were not changed.",
  "No se pudieron actualizar los sellos. Intentá de nuevo.":
    "The stamps couldn't be updated. Try again.",
  "Los cambios se guardan al instante.": "Changes save instantly.",
  "Cliente con membresía": "Client with membership",
  "Se suma a la tarjeta regular: seguís acumulando sellos.":
    "It adds to your regular card: you keep earning stamps.",
  "Tarjeta de sellos": "Stamp card",
  "La membresía es una suscripción mensual aparte. Los miembros usan esta misma tarjeta y siguen acumulando sellos.":
    "Membership is a separate monthly subscription. Members use this same card and keep earning stamps.",
  "Nombre completo": "Full name",
  "Fecha de nacimiento": "Date of birth",
  "Cumpleaños": "Birthday",
  "Sin fecha cargada": "No date on file",
  "Opcional. Se usa para el filtro y las notificaciones de cumpleaños.":
    "Optional. Used for the birthday filter and notifications.",
  "Sellos acumulados": "Accumulated stamps",
  "Si ponés la meta, se genera un premio pendiente y el contador vuelve a 0.":
    "If you enter the goal, a pending reward is created and the counter goes back to 0.",
  "Los datos se guardaron, pero no se pudo generar el premio. Los sellos no se modificaron.":
    "The details were saved, but the reward couldn't be created. Stamps were not changed.",
  "Los datos se guardaron, pero no se pudieron actualizar los sellos. Intentá de nuevo.":
    "The details were saved, but the stamps couldn't be updated. Try again.",
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
  "✅ ¡Cliente registrado! Ya puede escanear el QR para entrar.":
    "✅ Client registered! They can now scan the QR to check in.",
  "Acepto el tratamiento de datos personales según la ley 81 de Panamá.":
    "I agree to the personal data treatment under Panama's Law 81.",
  "No se pudo registrar. Verificá los datos e intentá de nuevo.":
    "Couldn't register. Check the details and try again.",
  "Revisá la fecha de nacimiento: día, mes y año.":
    "Check the birth date: day, month and year.",
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
  "Elegí la recompensa de tu programa. Todos los clientes, incluidos los miembros, usan la misma tarjeta de sellos.":
    "Choose your program reward. All clients, including members, use the same stamp card.",
  "✅ Tarjeta de cliente actualizada.": "✅ Client card updated.",
  "No se pudieron guardar los cambios. Intentá de nuevo.":
    "Couldn't save the changes. Try again.",
  "La tarjeta se guardó, pero no se pudieron regularizar los sellos. Corré el SQL de normalización en Supabase.":
    "The card was saved, but the stamps couldn't be normalized. Run the normalization SQL in Supabase.",
  "tarjetas regularizadas: sellos en 0 y premios pendientes.":
    "cards normalized: stamps back to 0 and pending rewards created.",
  "No había tarjetas en o por encima de la nueva meta.":
    "No cards were at or above the new goal.",
  "Solo el administrador puede modificar la tarjeta. Estás viendo la configuración actual.":
    "Only the admin can modify the card. You're seeing the current settings.",
  "Ej. 1 servicio gratis": "E.g. 1 free service",
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
  "¡Recompensa lista! Pasá por el salón a canjearla.":
    "Your reward is ready! Stop by the salon to redeem it.",
  "Ampliar QR para escanear": "Open QR to scan",
  "Ampliar código QR para escanear": "Open QR code to scan",
  "Código QR para escanear": "QR code to scan",
  "Código QR de la tarjeta de": "QR code for the card of",
  "Acerca el teléfono al lector del salón": "Hold your phone near the salon reader",
  "Cerrar": "Close",
  "Tu tarjeta de cliente": "Your client card",
  "No encontramos esa tarjeta": "We couldn't find that card",
  "Revisá el link que te pasamos o pedile al salón que te lo reenvíe.":
    "Check the link we sent you, or ask the salon to send it again.",
  "Mostrá este código en el salón para sumar tus sellos.":
    "Show this code at the salon to add your stamps.",
  "sello": "stamp",
  "sellos": "stamps",

  // ===== Notificaciones =====
  "Sin notificaciones": "No notifications",
  "Cuando haya algo nuevo, aparecerá aquí.":
    "When something new happens, it will appear here.",
  "Marcar todo como leído": "Mark all as read",
  "Marcar como entregado": "Mark as delivered",
  "Total": "Total",
  "Sin leer": "Unread",
  "Felicitar": "Congratulate",
  "Ver tarjeta": "See card",
  "Reagendar": "Reschedule",
  "HOY": "TODAY",
  "AHORA": "NOW",

  // ===== Panel de notificaciones =====
  "Atrás": "Back",
  "Volver atrás": "Go back",
  "Modo demostración": "Demo mode",
  "Así se ven las notificaciones": "This is how notifications look",
  "Ocultar demostración": "Hide demo",
  "Ver demostración": "View demo",

  // ===== Premios =====
  "Premio generado": "Prize generated",
  "Folio": "Reference",
  "Enviando correo…": "Sending email…",
  "Correo enviado a": "Email sent to",
  "El cliente no tiene correo cargado.": "The client has no email on file.",
  "No se pudo enviar el correo.": "The email could not be sent.",
  "Reintentar correo": "Retry email",
  "Enviar por WhatsApp": "Send via WhatsApp",
  "Aviso de premio": "Prize notice",
  "Enviando aviso…": "Sending notice…",
  "Aviso enviado a": "Notice sent to",
  "No se pudo enviar el aviso.": "The notice could not be sent.",
  "Reintentar aviso": "Retry notice",
  "Enviar aviso por WhatsApp": "Send notice via WhatsApp",
  "Queda pendiente en la campana hasta que lo entregues.":
    "It stays pending in the bell until you deliver it.",
  "Casi premio": "Almost there",

  // ===== Miembros (Fase 1) =====
  "Miembros": "Members",
  "Membresía mensual": "Monthly membership",
  "Cuota de": "Fee of",
  "de cada mes": "of every month",
  "días de gracia": "grace days",
  "La cuota se paga desde el primer mes de inscripción.":
    "The fee is charged from the first month of enrollment.",
  "Cuota por defecto": "Default fee",
  "Monto por defecto": "Default amount",
  "Guardar monto": "Save amount",
  "Se aplica a las cuotas nuevas. Las cuotas ya creadas conservan su monto.":
    "Applies to new dues. Dues already created keep their amount.",
  "Falta correr el SQL de Miembros en Supabase.":
    "The Members SQL hasn't been run in Supabase yet.",
  "Ejecutá el archivo supabase/fase-1-miembros.sql en el SQL Editor. Mientras tanto, la página puede quedar en modo lectura.":
    "Run supabase/fase-1-miembros.sql in the SQL Editor. Until then, this page may stay read-only.",
  "Detalle técnico": "Technical details",
  "Al día": "Up to date",
  "Pendientes": "Pending",
  "Vencidos": "Overdue",
  "Revisar": "Review",
  "Por vencer": "Due soon",
  "Vencido": "Overdue",
  "Sin período": "No period",
  "Exento": "Exempt",
  "Pagado": "Paid",
  "Pendiente": "Pending",
  "Por cobrar": "Outstanding",
  "Cobrado este mes": "Collected this month",
  "al día": "up to date",
  "cuota pendiente": "pending due",
  "cuotas pendientes": "pending dues",
  "Buscar por nombre, código o correo": "Search by name, code or email",
  "Nombre, código o correo": "Name, code or email",
  "pago registrado": "payment recorded",
  "pagos registrados": "payments recorded",
  "Recordar a pendientes": "Remind pending members",
  "Todavía no hay miembros.": "There are no members yet.",
  "Ningún miembro coincide con los filtros.":
    "No members match the filters.",
  "Marcá a una clienta como miembro desde Home para empezar.":
    "Mark a client as a member from Home to get started.",
  "Probá con otro nombre o limpiá los filtros.":
    "Try another name or clear the filters.",
  "Estado": "Status",
  "Cuota": "Fee",
  "Último pago": "Last payment",
  "Sin correo cargado": "No email on file",
  "cuotas": "dues",
  "Registrar pago": "Record payment",
  "Marcar al día": "Mark as paid",
  "Enviar recordatorio": "Send reminder",
  "Ver historial": "View history",
  "Detalle": "Details",
  "Recordar": "Remind",
  "Elegí una cuota.": "Choose a due.",
  "El monto debe ser mayor o igual a 0.":
    "The amount must be greater than or equal to 0.",
  "No se pudo guardar el pago. Intentá de nuevo.":
    "The payment couldn't be saved. Try again.",
  "Guardar pago": "Save payment",
  "No hay cuotas pendientes.": "There are no pending dues.",
  "Esta clienta ya está al día.": "This client is already up to date.",
  "¿Qué cuota pagó?": "Which due was paid?",
  "Cuota exenta": "Exempt due",
  "Cuota exenta, no se cobra.": "Exempt due, no charge.",
  "Vence el": "Due on",
  "vence el": "due on",
  "Sin vencimiento": "No due date",
  "Monto": "Amount",
  "Nota (opcional)": "Note (optional)",
  "Ej. pagó en efectivo, transferencia, etc.":
    "E.g. paid in cash, transfer, etc.",
  "Se registra solo la cuota elegida. Si hay meses anteriores pendientes, podés marcarlos uno por uno.":
    "Only the selected due is recorded. If previous months are pending, you can mark them one by one.",
  "No se pudo actualizar la marca de revisar.":
    "The review flag couldn't be updated.",
  "Se quitó la marca de revisar.": "Review flag cleared.",
  "Se marcó para revisar.": "Marked for review.",
  "Deshacer pago": "Undo payment",
  "Desmarcar al día": "Mark as unpaid",
  "Deshacer el último pago": "Undo the last payment",
  "¿Desmarcar este pago?": "Undo this payment?",
  "La cuota volverá a pendiente y la clienta dejará de figurar al día.":
    "The due will go back to pending and the client will no longer appear as up to date.",
  "Sí, desmarcar": "Yes, mark as unpaid",
  "Desmarcando…": "Marking as unpaid…",
  "¿Deshacer este pago? La cuota vuelve a pendiente.":
    "Undo this payment? The due will go back to pending.",
  "No se pudo deshacer el pago.": "The payment couldn't be undone.",
  "Pago deshecho. La cuota volvió a pendiente.":
    "Payment undone. The due is pending again.",
  "¿Quitar la membresía? La clienta sigue como cliente regular y conserva sus sellos.":
    "Remove the membership? The client stays a regular client and keeps their stamps.",
  "No se pudo quitar la membresía.": "The membership couldn't be removed.",
  "Membresía quitada. Sigue como cliente regular.":
    "Membership removed. They remain a regular client.",
  "Miembro desde": "Member since",
  "Cuota actual": "Current fee",
  "Total pagado:": "Total paid:",
  "Historial de cuotas": "Due history",
  "Todavía no hay cuotas generadas.": "No dues have been generated yet.",
  "Nota:": "Note:",
  "Pagado el": "Paid on",
  "Quitar revisar": "Clear review",
  "Marcar para revisar": "Mark for review",
  "La clienta sigue acumulando sellos en su tarjeta regular.":
    "The client keeps earning stamps on their regular card.",
  "Enviar recordatorios": "Send reminders",
  "Enviando…": "Sending…",
  "Se enviará un correo a": "An email will be sent to",
  "clienta": "client",
  "clientas": "clients",
  "con cuotas pendientes y correo cargado.":
    "with pending dues and an email on file.",
  "Se manda un solo recordatorio por clienta, por la cuota más vieja pendiente.":
    "One reminder is sent per client, for the oldest pending due.",
  "La clienta no tiene un correo válido.":
    "The client doesn't have a valid email.",
  "No se pudo enviar el recordatorio.": "The reminder couldn't be sent.",
  "Recordatorio enviado a": "Reminder sent to",
  "Se enviaron": "Sent",
  "recordatorio": "reminder",
  "recordatorios": "reminders",
  "omitidos": "skipped",
  "con error": "with errors",
  "No se pudieron enviar los recordatorios.":
    "The reminders couldn't be sent.",
  "Pago registrado.": "Payment recorded.",
  "No se pudo guardar el monto. Intentá de nuevo.":
    "The amount couldn't be saved. Try again.",
  "Monto guardado.": "Amount saved.",
  "Membresía vencida: se registró como cliente regular.":
    "Membership overdue: recorded as a regular client.",
};

export type Idioma = "es" | "en";