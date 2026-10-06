import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PillTabs } from "@/components/ui/pill-tabs";

export default function Demo() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">Demo de componentes</h1>

      <Card className="flex flex-col gap-3">
        <Button>Registrar y obtener QR</Button>
        <Button variant="accent">Iniciar</Button>
        <Button variant="subtle">Eliminar avatar</Button>
      </Card>

      <Card className="flex flex-col gap-2">
        <Field label="Correo electrónico">
          <Input placeholder="juang@email.com" />
        </Field>
      </Card>
    </main>
  );
}