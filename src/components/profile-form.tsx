"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { FACULTIES } from "@/lib/constants";
import { api, ErrorText, Modal, Submit } from "./client-ui";
export function ProfileForm({
  profile,
}: {
  profile: { name: string; faculty: string; cycle: string; bio: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button className="btn secondary" onClick={() => setOpen(true)}>
        <Pencil size={17} />
        Editar perfil
      </button>
      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Editar mi perfil">
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("profile", Object.fromEntries(new FormData(e.currentTarget)));
              setOpen(false);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Nombre completo
            <input name="name" defaultValue={profile.name} required minLength={2} maxLength={70} />
          </label>
          <label>
            Facultad
            <select name="faculty" defaultValue={profile.faculty}>
              {FACULTIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            Ciclo (opcional)
            <input
              name="cycle"
              defaultValue={profile.cycle}
              placeholder="Ej. 7.º ciclo"
              maxLength={20}
            />
          </label>
          <label>
            Sobre mí
            <textarea name="bio" defaultValue={profile.bio} maxLength={500} rows={3} />
          </label>
          <ErrorText message={error} />
          <Submit busy={busy}>Guardar cambios</Submit>
        </form>
      </Modal>
    </>
  );
}
