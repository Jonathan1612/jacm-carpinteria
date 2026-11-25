"use client";

import { useActionState } from "react";
import { addPhoto, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function PhotoForm() {
  const [state, action, pending] = useActionState(addPhoto, initial);

  return (
    <form action={action} className="stack">
      <label className="field">
        <span>Foto del trabajo</span>
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
        <small>JPG, PNG o WEBP. Máximo 4 MB.</small>
      </label>
      <label className="field">
        <span>Nota (opcional)</span>
        <input name="caption" maxLength={80} placeholder="Closet en Americana" />
      </label>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="form-ok" role="status">
          {state.ok}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Subiendo…" : "Agregar foto"}
      </button>
    </form>
  );
}
