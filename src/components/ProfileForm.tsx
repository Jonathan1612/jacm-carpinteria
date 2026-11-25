"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/lib/actions";
import { DAYS, SERVICES } from "@/lib/catalog";
import { formatPhone } from "@/lib/phone";

const initial: ActionState = {};

type Profile = {
  name: string;
  phone: string;
  city: string;
  zone: string;
  bio: string;
  email: string;
  services: string[];
  availableDays: string[];
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="stack">
      <p className="muted">
        Correo para entrar: <strong>{profile.email}</strong>
      </p>
      <label className="field">
        <span>Nombre</span>
        <input name="name" defaultValue={profile.name} required maxLength={80} />
      </label>
      <label className="field">
        <span>WhatsApp</span>
        <input
          name="phone"
          inputMode="numeric"
          defaultValue={formatPhone(profile.phone)}
          required
        />
      </label>
      <div className="split">
        <label className="field">
          <span>Ciudad</span>
          <input name="city" defaultValue={profile.city} required maxLength={80} />
        </label>
        <label className="field">
          <span>Zona que cubres</span>
          <input name="zone" defaultValue={profile.zone} required maxLength={160} />
        </label>
      </div>
      <label className="field">
        <span>Descripción</span>
        <textarea name="bio" defaultValue={profile.bio} maxLength={500} rows={4} />
        <small>Qué haces y cómo trabajas. Se ve en tu página.</small>
      </label>
      <fieldset>
        <legend>Servicios</legend>
        <div className="pills">
          {SERVICES.map((service) => (
            <label className="pill" key={service.id}>
              <input
                type="checkbox"
                name="services"
                value={service.id}
                defaultChecked={profile.services.includes(service.id)}
              />
              {service.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Días en los que puedes trabajar</legend>
        <div className="pills">
          {DAYS.map((day) => (
            <label className="pill" key={day.id}>
              <input
                type="checkbox"
                name="days"
                value={day.id}
                defaultChecked={profile.availableDays.includes(day.id)}
              />
              {day.label}
            </label>
          ))}
        </div>
        <small>El cliente solo puede pedir uno de estos días.</small>
      </fieldset>
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
        {pending ? "Guardando…" : "Guardar ficha"}
      </button>
    </form>
  );
}
