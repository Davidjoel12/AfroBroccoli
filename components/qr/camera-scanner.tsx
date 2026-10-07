"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type Estado = "idle" | "camera" | "exito" | "error" | "no-soportado";
type Mensaje = { tipo: "ok" | "no-encontrado" | "error"; texto: string } | null;

export function CameraScanner() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [resultado, setResultado] = useState<string>("");
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fallback, setFallback] = useState(false);
  const html5Ref = useRef<{ stop: () => Promise<void> } | null>(null);

  // Fallback para navegadores sin BarcodeDetector nativo (Safari/iOS)
  async function iniciarConHtml5Qrcode() {
    setFallback(true);
    await new Promise((r) => setTimeout(r, 100)); // espera a que se renderice el contenedor
    const { Html5Qrcode } = await import("html5-qrcode");
    const html5 = new Html5Qrcode("qr-reader");
    html5Ref.current = html5;
    try {
      await html5.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (valor) => {
          html5.stop().catch(() => {});
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
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, nombre, sellos(cantidad)")
      .eq("codigo", codigo)
      .single();

    if (!cliente) {
      setMensaje({ tipo: "no-encontrado", texto: `No hay ningún cliente con el código "${codigo}". Registralo primero desde el formulario.` });
      return;
    }

    await supabase.from("visitas").insert({ cliente_id: cliente.id });

    const sellosRow = Array.isArray(cliente.sellos) ? cliente.sellos[0] : cliente.sellos;
    const nuevaCantidad = (sellosRow?.cantidad ?? 0) + 1;
    await supabase
      .from("sellos")
      .upsert({ cliente_id: cliente.id, cantidad: nuevaCantidad, updated_at: new Date().toISOString() });

    setMensaje({ tipo: "ok", texto: `✅ Visita registrada para ${cliente.nombre}. Sellos: ${nuevaCantidad}.` });
  }


  function detener() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (html5Ref.current) {
      html5Ref.current.stop().catch(() => {});
      html5Ref.current = null;
    }
  }

  useEffect(() => () => detener(), []);

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

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        const detector = new Detector({ formats: ["qr_code"] });
        intervalRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
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
          }
        }, 500);
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
          <h2 className="text-lg font-semibold leading-tight">Iniciar Cámara para escanear QR</h2>
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
          <Button variant="subtle" onClick={() => { detener(); setFallback(false); setEstado("idle"); }}>Detener</Button>
        </>
      )}

      {estado === "exito" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
            ✅ QR leído: <span className="break-all font-semibold">{resultado}</span>
          </p>
          {mensaje && (
            <p className={`rounded-lg px-4 py-3 text-sm font-medium ${mensaje.tipo === "ok" ? "bg-primary/15" : "bg-pending/15"}`}>
              {mensaje.texto}
            </p>
          )}
          <Button className="w-full sm:w-auto" onClick={() => { setEstado("idle"); setMensaje(null); }}>Escanear de nuevo</Button>
        </div>
      )}

      {estado === "error" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            No se pudo acceder a la cámara. Verificá los permisos o probá en otro navegador.
          </p>
          <Button onClick={iniciar}>Reintentar</Button>
        </div>
      )}

      {estado === "no-soportado" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-pending/15 px-4 py-3 text-sm font-medium text-ink">
            Este navegador no soporta escaneo nativo de QR (BarcodeDetector). Usá Chrome/Edge en móvil, o la búsqueda manual.
          </p>
          <Button variant="subtle" onClick={() => setEstado("idle")}>Volver</Button>
        </div>
      )}
    </Card>
  );
}
