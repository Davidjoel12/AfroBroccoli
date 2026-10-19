"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { leerConfigTarjeta, metaDeCliente, recompensaDeCliente } from "@/lib/config";
import { abrirCamaraTrasera, constraintsCamaraTrasera } from "@/lib/camara";
import { useT } from "@/components/i18n/language-provider";

type Estado = "idle" | "camera" | "exito" | "error" | "no-soportado";
type Mensaje = { tipo: "ok" | "no-encontrado" | "error"; texto: string } | null;

export function CameraScanner() {
  const t = useT();
  const [estado, setEstado] = useState<Estado>("idle");
  const [resultado, setResultado] = useState<string>("");
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fallback, setFallback] = useState(false);
  const html5Ref = useRef<{ stop: () => Promise<void>; getState?: () => number } | null>(null);

  /**
   * Detiene el lector de html5-qrcode sin romper la app.
   *
   * OJO: `stop()` lanza de forma SÍNCRONA ("Cannot stop, scanner is not running or
   * paused") cuando el lector no está activo, aunque su tipo diga que devuelve
   * una promesa. Por eso el `.catch()` no alcanzaba: la excepción se escapaba
   * antes de adjuntarlo. Además el mismo lector se paraba dos veces (una al leer
   * el código y otra al desmontar), y la segunda siempre fallaba.
   */
  const detenerHtml5 = useCallback(() => {
    const html5 = html5Ref.current;
    html5Ref.current = null; // lo tomamos primero: así nunca se detiene dos veces
    if (!html5) return;
    try {
      const r = html5.stop();
      if (r && typeof r.then === "function") r.then(undefined, () => {});
    } catch {
      // ya estaba detenido: no hay nada que hacer
    }
  }, []);

  // Fallback para navegadores sin BarcodeDetector nativo (Safari/iOS)
  async function iniciarConHtml5Qrcode() {
    setFallback(true);
    await new Promise((r) => setTimeout(r, 100)); // espera a que se renderice el contenedor
    const { Html5Qrcode } = await import("html5-qrcode");
    const html5 = new Html5Qrcode("qr-reader");
    html5Ref.current = html5;
    try {
      // La cámara va DENTRO de videoConstraints: si se pasa aparte, esta
      // librería la ignora y el navegador abre la frontal.
      const videoConstraints = await constraintsCamaraTrasera();
      await html5.start(
        { facingMode: "environment" },
        {
          // fps más alto = mira más fotogramas por segundo = menos espera
          fps: 25,
          // Caja que se adapta al tamaño de la pantalla en vez de una fija de
          // 250 px, que en un teléfono deja poco margen y ralentiza la lectura.
          qrbox: (anchoVista, altoVista) => {
            const lado = Math.floor(Math.min(anchoVista, altoVista) * 0.78);
            return { width: lado, height: lado };
          },
          // Cámara trasera (deviceId) + resolución: más detalle por módulo y
          // el lector reconoce antes. Si el equipo no puede, el navegador ajusta.
          videoConstraints,
        },
        (valor) => {
          detenerHtml5();
          setResultado(valor);
          setEstado("exito");
          registrarVisita(extraerCodigo(valor));
        },
        () => {}
      );
    } catch {
      detener();
      setEstado("error");
    }
  }

  // Extrae el código del cliente del QR (URL "https://app.afrobroccoli.com/c/AB-0042" o texto "AB-0042")
  function extraerCodigo(valor: string): string {
    const match = valor.match(/\/c\/([^/\s?]+)/);
    return match ? match[1] : valor.trim();
  }

  async function registrarVisita(codigo: string) {
    // OJO con `.single()`: devuelve `data: null` si no hay filas **y también**
    // si hay más de una. Como antes no se miraba `error`, cualquier falla
    // terminaba mostrando "no hay ningún cliente con este código".
    // Con `limit(1)` tomamos la primera fila y, si la consulta falla de verdad,
    // mostramos ese error en vez de un mensaje mentiroso.
    const { data: filas, error } = await supabase
      .from("clientes")
      .select("id, nombre, membresia, sellos(cantidad)")
      .eq("codigo", codigo)
      .limit(1);

    if (error) {
      console.error("[escaneo: buscar cliente]", error.code, error.message, { codigo });
      setMensaje({
        tipo: "error",
        texto: `No se pudo consultar el cliente "${codigo}". ${error.message}`,
      });
      return;
    }

    const cliente = filas?.[0];
    console.info("[escaneo] filas para", codigo, "→", filas?.length ?? 0);

    if (!cliente) {
      setMensaje({ tipo: "no-encontrado", texto: `No hay ningún cliente con el código "${codigo}". Registralo primero desde el formulario.` });
      return;
    }

    const { error: errVisita } = await supabase
      .from("visitas")
      .insert({ cliente_id: cliente.id });
    if (errVisita) {
      console.error("[visita]", errVisita.code, errVisita.message);
      setMensaje({
        tipo: "error",
        texto: `Se encontró a ${cliente.nombre}, pero no se pudo guardar la visita. ${errVisita.message}`,
      });
      return;
    }

    const sellosRow = Array.isArray(cliente.sellos) ? cliente.sellos[0] : cliente.sellos;
    const nuevaCantidad = (sellosRow?.cantidad ?? 0) + 1;
    const { error: errSellos } = await supabase
      .from("sellos")
      .upsert({ cliente_id: cliente.id, cantidad: nuevaCantidad, updated_at: new Date().toISOString() });
    if (errSellos) {
      console.error("[sellos]", errSellos.code, errSellos.message);
      setMensaje({
        tipo: "error",
        texto: `Visita guardada, pero el sello de ${cliente.nombre} no se pudo actualizar. ${errSellos.message}`,
      });
      return;
    }

    // La meta depende del tipo de cliente (regular o miembro)
    const config = await leerConfigTarjeta(supabase);
    const meta = metaDeCliente(cliente.membresia, config);
    const recompensa = recompensaDeCliente(cliente.membresia, config);

    setMensaje({
      tipo: "ok",
      texto: `✅ Visita registrada para ${cliente.nombre}. Sellos: ${Math.min(nuevaCantidad, meta)}/${meta}. Recompensa: ${recompensa}.`,
    });
  }


  const detener = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (html5Ref.current) {
      detenerHtml5();
    }
  }, [detenerHtml5]);

  useEffect(() => () => detener(), [detener]);

  function iniciar() {
    setEstado("camera");
    setResultado("");
    setFallback(false);
    const Detector = (window as unknown as { BarcodeDetector?: new (o?: { formats?: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) {
      // Fallback: html5-qrcode funciona en navegadores sin BarcodeDetector (p. ej. Safari/iOS)
      iniciarConHtml5Qrcode();
      return;
    }

    // Cámara trasera a propósito: `abrirCamaraTrasera` elige el deviceId correcto
    // en vez de confiar en facingMode, que es solo una sugerencia y suele
    // terminar abriendo la cámara frontal.
    abrirCamaraTrasera()
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        const detector = new Detector({ formats: ["qr_code"] });
        // Sondeamos cada 200 ms en vez de 500: el detector es una función
        // sincrónica sobre el fotograma, así que el intervalo es la espera real.
        // Con 500 ms se perdían hasta medio segundo por lectura.
        let detectando = false;
        intervalRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          // Si el analyze anterior sigue corriendo, no apilamos detecciones:
          // el navegador puede pedir muchas si el frame tarda.
          if (detectando) return;
          detectando = true;
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) {
              detener();
              const valor = codes[0].rawValue;
              setResultado(valor);
              setEstado("exito");
              registrarVisita(extraerCodigo(valor));
            }
          } catch {
            // frames sin QR, seguimos esperando
          } finally {
            detectando = false;
          }
        }, 200);
      })
      .catch(() => {
        detener();
        setEstado("error");
      });
  }

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
          <h2 className="text-lg font-semibold leading-tight">{t("Iniciar Cámara para escanear QR")}</h2>
        </div>

        {estado === "idle" && (
          <Button variant="accent" className="whitespace-nowrap" onClick={iniciar}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Iniciar
          </Button>
        )}
      </div>

      {estado === "camera" && (
        <>
          {fallback ? (
            <div id="qr-reader" className="aspect-video w-full overflow-hidden rounded-lg border border-ink/10 bg-black" />
          ) : (
            <video ref={videoRef} className="aspect-video w-full rounded-lg border border-ink/10 bg-black" playsInline muted />
          )}
          <Button variant="subtle" onClick={() => { detener(); setFallback(false); setEstado("idle"); }}>{t("Detener")}</Button>
        </>
      )}

      {estado === "exito" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
            {t("✅ QR leído:")} <span className="break-all font-semibold">{resultado}</span>
          </p>
          {mensaje && (
            <p className={`rounded-lg px-4 py-3 text-sm font-medium ${mensaje.tipo === "ok" ? "bg-primary/15" : "bg-pending/15"}`}>
              {mensaje.texto}
            </p>
          )}
          <Button className="w-full sm:w-auto" onClick={() => { setEstado("idle"); setMensaje(null); }}>{t("Escanear de nuevo")}</Button>
        </div>
      )}

      {estado === "error" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {t("No se pudo acceder a la cámara. Verificá los permisos o probá en otro navegador.")}
          </p>
          <Button onClick={iniciar}>{t("Reintentar")}</Button>
        </div>
      )}

      {estado === "no-soportado" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-pending/15 px-4 py-3 text-sm font-medium text-ink">
            {t("Este navegador no soporta escaneo nativo de QR (BarcodeDetector). Usá Chrome/Edge en móvil, o la búsqueda manual.")}
          </p>
          <Button variant="subtle" onClick={() => setEstado("idle")}>{t("Volver")}</Button>
        </div>
      )}
    </Card>
  );
}
