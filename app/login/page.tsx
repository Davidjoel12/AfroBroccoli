import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import LoginForm from "./login-form";

export default function LoginPage() {
    return (
        <main className="flex min-h-dvh flex-col lg:flex-row">
            {/* === Panel de marca */}
            <section className="flex items-center justify-center bg-ink px-8 py-12 lg:w-1/2 lg:py-20">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="grid h-30 w-30 place-items-center rounded-2xl bg-black">
                        <Image src="/logo.jpg" alt="AfroBroccoli" width={160} height={160} className="rounded-2xl" />
                    </div>
                    <h1 className="font-script text-5xl leading-tight text-cream">
                        AfroBroccoli
                    </h1>
                    <p className="text-sm font-medium text-mint">
                        Gestión interna de clientes, sellos y equipo.
                    </p>
                    </div>
                </section>

                {/* ===== Formulario ===== */}
                <section className="flex flex-1 items-center justify-center p-6 md:p-8">
                    <LoginForm />
            </section>
        </main>
    );
}    