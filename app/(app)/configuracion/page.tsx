import ProfileForm from "@/components/config/profile-form";
import { devDelay } from "@/lib/dev-delay";

export default async function ConfiguracionPage() {
  await devDelay();
  return <ProfileForm />;
}
