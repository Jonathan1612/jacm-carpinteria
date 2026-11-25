"use client";

import { useActionState } from "react";
import { login, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="stack">
      <label className="field">
        <span>Correo</span>
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
