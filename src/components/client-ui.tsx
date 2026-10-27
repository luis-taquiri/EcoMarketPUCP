"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, LoaderCircle, X } from "lucide-react";
export async function api(action: string, data: Record<string, unknown> = {}) {
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo completar la operación.");
  return result as { ok: boolean; id?: string };
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error">
      {message}
    </p>
  ) : null;
}
export function Submit({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button className="btn" type="submit" disabled={busy}>
      {busy && <LoaderCircle size={18} className="spin" />}
      {children}
    </button>
  );
}
export function ActionButton({
  action,
  data = {},
  children,
  confirm,
  href,
  className = "btn secondary",
}: {
  action: string;
  data?: Record<string, unknown>;
  children: React.ReactNode;
  confirm?: string;
  href?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="action-wrap">
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setError("");
          try {
            await api(action, data);
            if (href) router.push(href);
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy && <LoaderCircle size={16} className="spin" />}
        {children}
      </button>
      <ErrorText message={error} />
    </div>
  );
}
export function FavoriteButton({ id, saved }: { id: string; saved: boolean }) {
  const [value, setValue] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setValue(saved), [saved]);
  return (
    <>
      <button
        className={`favorite ${value ? "saved" : ""}`}
        title={value ? "Quitar de favoritos" : "Guardar en favoritos"}
        aria-label={value ? "Quitar de favoritos" : "Guardar en favoritos"}
        aria-pressed={value}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("favorite", { id, saved: !value });
            setValue(!value);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Heart size={20} fill={value ? "currentColor" : "none"} />
      </button>
      {error && (
        <span className="favorite-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={onClose} title="Cerrar" aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
