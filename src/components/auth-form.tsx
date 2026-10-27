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
        const form = new FormData(e.currentTarget);
        const data: Record<string, unknown> = Object.fromEntries(form);
        if (register) {
          data.acceptTerms = form.get("acceptTerms") === "on";
          data.consentData = form.get("consentData") === "on";
        }
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
          maxLength={254}
          pattern="[^@\s]+@[pP][uU][cC][pP]\.[eE][dD][uU]\.[pP][eE]"
          title="Usa un correo cuyo dominio sea exactamente pucp.edu.pe."
          onInput={(e) => e.currentTarget.setCustomValidity("")}
          onBlur={(e) => {
            const input = e.currentTarget;
            input.value = input.value.trim().toLowerCase();
            input.setCustomValidity(
              input.value && !/^[^@\s]+@pucp\.edu\.pe$/.test(input.value)
                ? "Usa un correo cuyo dominio sea exactamente @pucp.edu.pe."
                : "",
            );
          }}
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
            minLength={register ? 15 : 1}
            maxLength={72}
            required
            placeholder={register ? "Mínimo 15 caracteres" : "Tu contraseña"}
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
      {register && (
        <fieldset className="registration-consent">
          <legend>Privacidad y condiciones</legend>
          <p id="consent-summary">
            Usaremos tus datos para gestionar tu cuenta y tus intercambios. Tu nombre, facultad,
            perfil y publicaciones serán visibles para otros usuarios registrados. No los usamos
            para publicidad ni los vendemos.
          </p>
          <label className="consent-option">
            <input type="checkbox" name="acceptTerms" required />
            <span>
              He leído y acepto los{" "}
              <Link href="/terminos" target="_blank" rel="noopener noreferrer">
                términos de uso
              </Link>
              .
            </span>
          </label>
          <label className="consent-option">
            <input type="checkbox" name="consentData" required aria-describedby="consent-summary" />
            <span>
              He leído el{" "}
              <Link href="/privacidad" target="_blank" rel="noopener noreferrer">
                aviso de privacidad
              </Link>{" "}
              y autorizo el tratamiento de mis datos para crear mi cuenta y participar en EcoMarket.
            </span>
          </label>
          <p>
            Ambas casillas son necesarias para registrarte. Puedes consultar cómo ejercer tus
            derechos o retirar tu autorización en el aviso de privacidad.
          </p>
        </fieldset>
      )}
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
