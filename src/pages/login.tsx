import Logo from "../assets/logo.svg";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <img src={Logo} alt="logo" className="mx-auto" />
        <h1 className="text-4xl font-semibold text-center mb-2">Räknar-app</h1>
        <LoginForm />
      </div>
    </div>
  );
}
