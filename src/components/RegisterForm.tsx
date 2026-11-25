"use client";

import { useActionState } from "react";
import { register, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial);

  return (
    <form action={action} className="stack">
      <label className="field">
        <span>Nombre</span>
        <input name="name" autoComplete="name" required maxLength={80} />
      </label>
      <label className="field">
        <span>Correo para entrar</span>
        <input name="email" type="email" autoComplete="email" required maxLength={120} />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <small>Mínimo 8 caracteres. Solo tú la usas para editar tu taller.</small>
      </label>
      <label className="field">
        <span>WhatsApp</span>
        <input name="phone" inputMode="numeric" autoComplete="tel" required placeholder="33 1234 5678" />
        <small>10 dígitos. Con este número te escriben los clientes.</small>
      </label>
      <label className="field">
        <span>Ciudad</span>
        <input name="city" required maxLength={80} placeholder="Guadalajara" />
      </label>
      <label className="field">
        <span>Zona que cubres</span>
        <input name="zone" required maxLength={160} placeholder="Providencia, Americana, centro" />
      </label>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear mi taller"}
      </button>
    </form>
  );
}
