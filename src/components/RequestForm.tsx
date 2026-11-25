"use client";

import { useActionState } from "react";
import { requestVisit, type RequestState } from "@/lib/actions";

const initial: RequestState = {};

export function RequestForm({
  carpenterId,
  days,
}: {
  carpenterId: string;
  days: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(requestVisit, initial);

  if (state.ok) {
    return (
      <div className="notice" role="status">
        <p>{state.ok}</p>
        {state.whatsapp ? (
          <a className="btn btn-wa" href={state.whatsapp} target="_blank" rel="noreferrer">
            Avisarle también por WhatsApp
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="carpenterId" value={carpenterId} />
      <label className="field">
        <span>Tu nombre</span>
        <input name="clientName" required maxLength={80} autoComplete="name" />
      </label>
      <label className="field">
        <span>Tu teléfono</span>
        <input name="clientPhone" inputMode="numeric" required autoComplete="tel" placeholder="33 1234 5678" />
      </label>
      <label className="field">
        <span>Qué necesitas</span>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={400}
          rows={3}
          placeholder="Un closet de dos metros para la recámara."
        />
      </label>
      <label className="field">
        <span>Día</span>
        <select name="day" required defaultValue="">
          <option value="">Elige un día</option>
          {days.map((day) => (
            <option key={day.id} value={day.id}>
              {day.label}
            </option>
          ))}
        </select>
      </label>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
