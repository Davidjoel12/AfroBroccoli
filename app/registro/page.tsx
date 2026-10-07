import Image from "next/image";
import { RegisterForm } from "@/components/qr/register-form";

// Registro público: no requiere login (el proxy la deja pasar)
export default function RegistroPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-cream px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/logo.jpg" alt="AfroBroccoli" width={72} height={72} className="rounded-2xl" />
        <h1 className="font-script text-4xl leading-tight">AfroBroccoli</h1>
        <p className="text-sm text-muted">Registrate para obtener tu tarjeta de cliente</p>
      </div>
      <div className="w-full max-w-xl">
        <RegisterForm mostrarMembresia={false} />
      </div>
    </main>
  );
}
