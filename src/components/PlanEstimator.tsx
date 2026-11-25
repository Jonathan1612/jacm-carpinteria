"use client";

import { useActionState } from "react";
import { estimatePlan, type PlanState } from "@/lib/actions";
import { SERVICES } from "@/lib/catalog";

const initial: PlanState = {};

type MaterialOption = {
  id: string;
  name: string;
  thicknessMm: number;
  pricePerLinearMeter: number;
  notes: string;
};

const PLAN_SERVICES = SERVICES.filter((s) => ["closet", "cocina", "mueble"].includes(s.id));

function fmtMoney(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

function fmtMm(mm: number) {
  return `${(mm / 10).toFixed(1)} cm`;
}

export function PlanEstimator({ materials }: { materials: MaterialOption[] }) {
  const [state, action, pending] = useActionState(estimatePlan, initial);
  const plan = state.plan;

  return (
    <div className="plan-block">
      <form action={action} className="stack">
        <label className="field">
          <span>Tipo de mueble</span>
          <select name="serviceId" required defaultValue="closet">
            {PLAN_SERVICES.map((service) => (
              <option key={service.id} value={service.id}>
                {service.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Material</span>
          <select name="materialId" required defaultValue="">
            <option value="">Elige material</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} · {fmtMoney(material.pricePerLinearMeter)}/m
              </option>
            ))}
          </select>
        </label>
        <div className="split tri">
          <label className="field">
            <span>Ancho (cm)</span>
            <input name="widthCm" type="number" min={40} max={600} step={0.1} defaultValue={180} required />
          </label>
          <label className="field">
            <span>Alto (cm)</span>
            <input name="heightCm" type="number" min={80} max={280} step={0.1} defaultValue={240} required />
          </label>
          <label className="field">
            <span>Fondo (cm)</span>
            <input name="depthCm" type="number" min={30} max={80} step={0.1} defaultValue={60} required />
          </label>
        </div>
        <label className="field">
          <span>Entrepaños o niveles</span>
          <input name="shelves" type="number" min={0} max={6} defaultValue={3} />
          <small>Para clóset: repisas interiores. Para mueble tipo librero: cantidad de repisas.</small>
        </label>
        {state.error ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={pending || materials.length === 0}>
          {pending ? "Calculando…" : "Generar lista y plano"}
        </button>
      </form>

      {plan ? (
        <div className="plan-result" id="plan-result">
          <div className="plan-summary">
            <p>
              <strong>{plan.serviceLabel}</strong> en <strong>{plan.materialName}</strong>
            </p>
            <p className="price-tag">{fmtMoney(plan.priceEstimateMxn)}</p>
            <p className="muted">{plan.priceNote}</p>
            <p>
              Tableros ({plan.sheetLabel}): <strong>{plan.sheetsNeeded}</strong> · área útil ~
              {plan.usedAreaM2.toFixed(2)} m²
            </p>
          </div>
          <div className="plan-sketch" dangerouslySetInnerHTML={{ __html: plan.sketchSvg }} />
          <h3>Piezas a cortar</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th>Cant.</th>
                  <th>Ancho</th>
                  <th>Alto</th>
                  <th>Esp.</th>
                  <th>Material</th>
                </tr>
              </thead>
              <tbody>
                {plan.parts.map((part) => (
                  <tr key={`${part.code}-${part.name}`}>
                    <td>
                      <strong>{part.code}</strong> {part.name}
                    </td>
                    <td>{part.qty}</td>
                    <td>{fmtMm(part.widthMm)}</td>
                    <td>{fmtMm(part.heightMm)}</td>
                    <td>{part.thicknessMm} mm</td>
                    <td>{part.materialName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Lo que se necesita además</h3>
          <ul className="supply-list">
            {plan.supplies.map((item) => (
              <li key={item.name}>
                <strong>{item.qty}</strong> {item.unit} · {item.name}
                {item.note ? <span className="muted"> — {item.note}</span> : null}
              </li>
            ))}
          </ul>
          <p className="muted plan-disclaimer">
            Lista orientativa para cotizar y fabricar. Antes de cortar hay que verificar medidas en sitio, herrajes
            y desperdicio real.
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            Imprimir o guardar PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}