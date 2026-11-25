"use client";

import { useActionState } from "react";
import { deleteMaterial, saveMaterial, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export type MaterialRow = {
  id: string;
  name: string;
  thicknessMm: number;
  pricePerSheet: number;
  pricePerLinearMeter: number;
  notes: string;
  sortOrder: number;
  active: boolean;
};

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

export function MaterialsAdmin({ materials }: { materials: MaterialRow[] }) {
  const [state, action, pending] = useActionState(saveMaterial, initial);

  return (
    <div className="stack" style={{ gap: "24px" }}>
      <div>
        <h2>Materiales y precios</h2>
        <p className="muted">El cliente los ve en inicio y usa el cotizador. El precio por metro lineal define el estimado.</p>
      </div>

      <ul className="material-admin-list">
        {materials.map((material) => (
          <li key={material.id} className={material.active ? "" : "inactive"}>
            <form action={action} className="stack material-edit">
              <input type="hidden" name="id" value={material.id} />
              <label className="field">
                <span>Nombre</span>
                <input name="name" defaultValue={material.name} required maxLength={80} />
              </label>
              <div className="split">
                <label className="field">
                  <span>Espesor (mm)</span>
                  <input name="thicknessMm" type="number" defaultValue={material.thicknessMm} min={6} max={40} required />
                </label>
                <label className="field">
                  <span>Orden</span>
                  <input name="sortOrder" type="number" defaultValue={material.sortOrder} />
                </label>
              </div>
              <div className="split">
                <label className="field">
                  <span>Precio lámina (MXN)</span>
                  <input name="pricePerSheet" defaultValue={material.pricePerSheet} required />
                </label>
                <label className="field">
                  <span>Precio por m lineal (MXN)</span>
                  <input name="pricePerLinearMeter" defaultValue={material.pricePerLinearMeter} required />
                </label>
              </div>
              <label className="field">
                <span>Notas para el cliente</span>
                <input name="notes" defaultValue={material.notes} maxLength={200} />
              </label>
              <label className="pill">
                <input type="checkbox" name="active" defaultChecked={material.active} />
                Visible en la página
              </label>
              <div className="row-actions">
                <button className="btn btn-primary btn-small" type="submit" disabled={pending}>
                  Guardar
                </button>
              </div>
            </form>
            <p className="muted preview-line">
              Vista cliente: {money(material.pricePerLinearMeter)}/m · lámina {money(material.pricePerSheet)}
            </p>
            <form action={deleteMaterial}>
              <input type="hidden" name="id" value={material.id} />
              <button
                className="btn btn-danger btn-small"
                type="submit"
                onClick={(e) => {
                  if (!window.confirm(`¿Quitar “${material.name}”?`)) e.preventDefault();
                }}
              >
                Eliminar
              </button>
            </form>
          </li>
        ))}
      </ul>

      <section className="panel inner-panel">
        <h3>Agregar material</h3>
        <form action={action} className="stack">
          <label className="field">
            <span>Nombre</span>
            <input name="name" required maxLength={80} placeholder="MDF melamina 18 mm" />
          </label>
          <div className="split">
            <label className="field">
              <span>Espesor (mm)</span>
              <input name="thicknessMm" type="number" defaultValue={18} min={6} max={40} required />
            </label>
            <label className="field">
              <span>Orden</span>
              <input name="sortOrder" type="number" defaultValue={materials.length} />
            </label>
          </div>
          <div className="split">
            <label className="field">
              <span>Precio lámina (MXN)</span>
              <input name="pricePerSheet" defaultValue={350} required />
            </label>
            <label className="field">
              <span>Precio por m lineal (MXN)</span>
              <input name="pricePerLinearMeter" defaultValue={7000} required />
            </label>
          </div>
          <label className="field">
            <span>Notas</span>
            <input name="notes" maxLength={200} placeholder="Colores disponibles, proveedor, etc." />
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
            {pending ? "Guardando…" : "Agregar material"}
          </button>
        </form>
      </section>
    </div>
  );
}