"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { FACULTIES } from "@/lib/constants";
import { api, ErrorText, Submit } from "./client-ui";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          await api(register ? "register" : "login", data);
          router.push("/explorar");
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {register && (
        <>
          <label>
            Nombre completo
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={70}
              required
              placeholder="Tu nombre y apellido"
            />
          </label>
          <label>
            Facultad
            <select name="faculty" required>
              <option value="">Selecciona tu facultad</option>
              {FACULTIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </>
      )}
      <label>
        Correo PUCP
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu.nombre@pucp.edu.pe"
        />
      </label>
      <label>
        Contraseña
        <span className="password-input">
          <input
            name="password"
            aria-label="Contraseña"
            type={visible ? "text" : "password"}
            autoComplete={register ? "new-password" : "current-password"}
            minLength={8}
            maxLength={72}
            required
            placeholder={register ? "Mínimo 8 caracteres" : "Tu contraseña"}
          />
          <button
            type="button"
            title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </span>
      </label>
      <ErrorText message={error} />
      <Submit busy={busy}>
        {register ? "Crear mi cuenta" : "Ingresar al campus"}
        <ArrowRight size={18} />
      </Submit>
      <p className="auth-switch">
        {register ? "¿Ya tienes cuenta?" : "¿Es tu primera vez?"}{" "}
        <Link href={register ? "/login" : "/registro"}>
          {register ? "Inicia sesión" : "Crea tu cuenta"}
        </Link>
      </p>
    </form>
  );
}
