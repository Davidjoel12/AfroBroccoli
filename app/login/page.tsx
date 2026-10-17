import LoginForm from "./login-form";
import LoginBrand from "./login-brand";
import { devDelay } from "@/lib/dev-delay";

export default async function LoginPage() {
    await devDelay();
    return (
        <main className="flex min-h-dvh flex-col lg:flex-row">
            {/* === Panel de marca */}
            <LoginBrand />

            {/* ===== Formulario ===== */}
            <section className="flex flex-1 items-center justify-center p-6 md:p-8">
                <LoginForm />
            </section>
        </main>
    );
}