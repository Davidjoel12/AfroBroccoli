"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Estado = "idle" | "camera" | "exito" | "error" | "no-soportado";

export function CameraScanner() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [resultado, setResultado] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function detener() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => () => detener(), []);

  function iniciar() {
    setEstado("camera");
    setResultado("");
    const Detector = (window as unknown as { BarcodeDetector?: new (o?: { formats?: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) {
      setEstado("no-soportado");
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
              setResultado(codes[0].rawValue);
              setEstado("exito");
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
          <video ref={videoRef} className="aspect-video w-full rounded-lg border border-ink/10 bg-black" playsInline muted />
          <Button variant="subtle" onClick={() => { detener(); setEstado("idle"); }}>Detener</Button>
        </>
      )}

      {estado === "exito" && (
        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
            ✅ QR leído: <span className="break-all font-semibold">{resultado}</span>
          </p>
          <Button className="w-full sm:w-auto" onClick={() => setEstado("idle")}>Escanear de nuevo</Button>
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
