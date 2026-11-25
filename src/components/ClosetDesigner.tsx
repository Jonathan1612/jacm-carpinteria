"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TEMPLATE_CATEGORIES,
  buildVisualPlan,
  allSectionDefs,
  drawingSectionDefs,
  surroundSectionDefs,
  shelfBoardSectionDefs,
  hangRodSectionDefs,
  shelvesAndRodsSectionDefs,
  carcassFaceSectionDefs,
  drawerFrontSectionDefs,
  drawerHeightCm,
  interiorDividerSectionDefs,
  resyncAllDrawerFronts,
  formatCm,
  roundCm,
  cabinDimensionSummary,
  defaultSectionMeasures,
  isDoorSectionId,
  downloadPlanHtml,
  type SectionMeasure,
  type TemplateCategory,
  type VisualPlanPart,
} from "@/lib/closet-design";
import { ClosetSideView } from "@/components/ClosetSideView";
import { CabinSizeFields } from "@/components/CabinSizeFields";
import { PlanBuilderCanvas } from "@/components/PlanBuilderCanvas";
import { PlanTouchStage } from "@/components/PlanTouchStage";
import { createBlankTemplate, setTemplateDoors, syncTemplateMeta } from "@/lib/plan-builder";
import { deleteLocalPlan, readLocalPlans, upsertLocalPlan } from "@/lib/plan-storage";
import type { ClosetTemplate } from "@/lib/closet-design";

type MaterialOption = {
  id: string;
  name: string;
  thicknessMm: number;
  pricePerLinearMeter: number;
};

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

type Phase = "design" | "measure";

type SectionRow = { id: string; label: string; hint?: string };

function measureFieldLabels(kind: string | undefined) {
  if (kind === "shelf-board") {
    return { a: "Largo (cm)", b: "Espesor (cm)", c: "Profundidad (cm)" };
  }
  if (kind === "divider") {
    return { a: "Fondo carcasa (cm)", b: "Alto (cm)", c: "Espesor (cm)" };
  }
  if (kind === "door") {
    return { a: "Ancho (cm)", b: "Alto (cm)", c: "Espesor tablero (cm)" };
  }
  if (kind === "rod") {
    return { a: "Largo del tubo (cm)", b: "Diámetro (cm)", c: "Altura al centro (cm)" };
  }
  if (kind === "carcass") {
    return { a: "Fondo carcasa (cm)", b: "Alto (cm)", c: "Espesor tablero (cm)" };
  }
  if (kind === "drawer-front") {
    return { a: "Ancho frente (cm)", b: "Alto frente (cm)", c: "Espesor (cm)" };
  }
  return { a: "Ancho (cm)", b: "Alto (cm)", c: "Fondo (cm)" };
}

function SectionPicker({
  rows,
  displaySections,
  selectedId,
  onSelect,
}: {
  rows: SectionRow[];
  displaySections: Record<string, SectionMeasure>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
  <>
      <ul className="section-card-list">
        {rows.map((sec) => {
          const m = displaySections[sec.id];
          const active = sec.id === selectedId;
          return (
            <li key={sec.id}>
              <button
                type="button"
                className={`section-card${active ? " is-selected" : ""}${m?.done ? " is-done" : ""}`}
                onClick={() => onSelect(sec.id)}
              >
                <span className="section-card-head">
                  <span className="section-card-title">{sec.label}</span>
                  {m?.done ? <span className="status-ok">Listo</span> : <span className="status-pending">Pendiente</span>}
                </span>
                <span className="section-card-meta">
                  {formatCm(m?.widthCm)} × {formatCm(m?.heightCm)} × {formatCm(m?.depthCm)} cm
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="table-wrap section-table-desktop">
        <table className="data-table sections-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Parte</th>
              <th>Ancho</th>
              <th>Alto</th>
              <th>Fondo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sec) => {
              const m = displaySections[sec.id];
              const active = sec.id === selectedId;
              return (
                <tr
                  key={sec.id}
                  className={`section-row${active ? " is-selected" : ""}${m?.done ? " is-done" : ""}`}
                  onClick={() => onSelect(sec.id)}
                  tabIndex={0}
                  role="button"
                >
                  <td>{m?.done ? <span className="status-ok">Listo</span> : <span className="status-pending">Pendiente</span>}</td>
                  <td>{sec.label}</td>
                  <td>{formatCm(m?.widthCm)}</td>
                  <td>{formatCm(m?.heightCm)}</td>
                  <td>{formatCm(m?.depthCm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PartTable({ parts }: { parts: VisualPlanPart[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Pieza</th>
            <th>Cant.</th>
            <th>Ancho</th>
          <th>Alto</th>
          <th>Fondo</th>
          <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.id}>
              <td>{part.label}</td>
              <td>{part.qty}</td>
              <td>{(part.widthMm / 10).toFixed(1)} cm</td>
              <td>{(part.heightMm / 10).toFixed(1)} cm</td>
              <td>{part.depthMm != null ? `${(part.depthMm / 10).toFixed(1)} cm` : "—"}</td>
              <td>{part.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClosetDesigner({ materials }: { materials: MaterialOption[] }) {
  const [phase, setPhase] = useState<Phase>("design");
  const [category, setCategory] = useState<TemplateCategory>("closet");
  const [template, setTemplate] = useState<ClosetTemplate>(() => createBlankTemplate("Nuevo diseño", "closet"));
  const [savedPlans, setSavedPlans] = useState<ClosetTemplate[]>([]);
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [widthCm, setWidthCm] = useState(240);
  const [heightCm, setHeightCm] = useState(240);
  const [depthCm, setDepthCm] = useState(60);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, SectionMeasure>>({});
  const [showDoors, setShowDoors] = useState(true);
  const [planFocus, setPlanFocus] = useState<"zones" | "shelves-rods">("zones");
  const [planView, setPlanView] = useState<"front" | "side">("front");

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      setShowDoors(false);
    }
    setSavedPlans(readLocalPlans());
  }, []);

  useEffect(() => {
    setTemplate((t) => syncTemplateMeta({ ...t, category }));
  }, [category]);
  const material = materials.find((m) => m.id === materialId) ?? materials[0];
  const thicknessMm = material?.thicknessMm ?? 18;
  const cabinDims = useMemo(
    () => cabinDimensionSummary(widthCm, heightCm, thicknessMm),
    [widthCm, heightCm, thicknessMm],
  );

  const displaySections = useMemo(() => {
    const base =
      Object.keys(sections).length > 0
        ? sections
        : defaultSectionMeasures(template, widthCm, heightCm, depthCm, thicknessMm);
    return resyncAllDrawerFronts(template, widthCm, heightCm, thicknessMm, base);
  }, [sections, template, widthCm, heightCm, depthCm, thicknessMm]);

  const drawerFrontDefs = useMemo(
    () => drawerFrontSectionDefs(template, displaySections),
    [template, displaySections],
  );
  const sectionDefs = allSectionDefs(template, displaySections);
  const compartmentDefs = template.sections;
  const doorDefs = drawingSectionDefs(template).filter((s) => s.kind === "door");
  const shelfBoardDefs = shelfBoardSectionDefs(template);
  const rodDefs = hangRodSectionDefs(template);
  const shelvesAndRods = shelvesAndRodsSectionDefs(template);
  const dividerDefs = interiorDividerSectionDefs(template);
  const carcassFaceDefs = carcassFaceSectionDefs(template);
  const surroundDefs = surroundSectionDefs(template).filter((s) => s.id === "struct-back");
  const selectedSection = sectionDefs.find((s) => s.id === selectedId) ?? null;
  const fieldLabels = measureFieldLabels(selectedSection?.kind);

  const allDone = sectionDefs.every((s) => displaySections[s.id]?.done);

  const plan = useMemo(() => {
    if (!material) return null;
    return buildVisualPlan({
      template,
      materialName: material.name,
      thicknessMm: material.thicknessMm,
      pricePerLinearMeter: material.pricePerLinearMeter,
      outerWidthCm: widthCm,
      outerHeightCm: heightCm,
      outerDepthCm: depthCm,
      sections: displaySections,
      activeSectionId: selectedId ?? undefined,
      showDoors,
    });
  }, [material, displaySections, template, widthCm, heightCm, depthCm, selectedId, showDoors]);

  function confirmDiscardMeasures() {
    const anyDone = Object.values(sections).some((s) => s.done);
    const started = Object.keys(sections).length > 0;
    if (!started) return true;
    if (!anyDone) return true;
    return typeof window !== "undefined"
      ? window.confirm("Cambiar plantilla o tipo borra las medidas guardadas (verde). ¿Continuar?")
      : true;
  }

  function resetMeasuresAfterTemplateChange() {
    setSections({});
    setSelectedId(null);
    setPlanFocus("zones");
    setPlanView("front");
  }

  function refreshSaved() {
    setSavedPlans(readLocalPlans());
  }

  function saveCurrentPlan() {
    const name =
      typeof window !== "undefined"
        ? window.prompt("Nombre para guardar este diseño", template.name)?.trim() || template.name
        : template.name;
    const next = syncTemplateMeta({ ...template, name, id: template.id || `plan-${Date.now()}` });
    setTemplate(next);
    upsertLocalPlan(next);
    refreshSaved();
  }

  function loadPlan(plan: ClosetTemplate) {
    if (!confirmDiscardMeasures()) return;
    setCategory(plan.category);
    setTemplate(syncTemplateMeta(plan));
    resetMeasuresAfterTemplateChange();
    setPhase("design");
  }

  function newBlankPlan() {
    if (!confirmDiscardMeasures()) return;
    setTemplate(createBlankTemplate("Nuevo diseño", category));
    resetMeasuresAfterTemplateChange();
    setPhase("design");
  }

  function removeSavedPlan(planId: string) {
    if (typeof window !== "undefined" && !window.confirm("¿Borrar este diseño guardado?")) return;
    deleteLocalPlan(planId);
    refreshSaved();
  }

  function beginMeasure(sectionId?: string) {
    const defs = allSectionDefs(template, displaySections);
    setSections((prev) => {
      if (Object.keys(prev).length > 0) {
        return resyncAllDrawerFronts(template, widthCm, heightCm, thicknessMm, prev);
      }
      const fresh = defaultSectionMeasures(template, widthCm, heightCm, depthCm, thicknessMm);
      return resyncAllDrawerFronts(template, widthCm, heightCm, thicknessMm, fresh);
    });
    setSelectedId(sectionId ?? defs[0]?.id ?? null);
    setPhase("measure");
  }

  function startMeasuring() {
    if (template.sections.length < 2) {
      window.alert("Agrega al menos una pieza además del zócalo antes de medir.");
      return;
    }
    beginMeasure();
  }

  function selectSection(id: string) {
    if (phase === "design") {
      startMeasuring();
      setSelectedId(id);
      return;
    }
    setSelectedId(id);
  }

  function updateSelected(width: number, height: number, depth: number) {
    if (!selectedId) return;
    setSections((prev) => {
      const next: Record<string, SectionMeasure> = {
        ...prev,
        [selectedId]: {
          ...prev[selectedId],
          widthCm: roundCm(width),
          heightCm: roundCm(height),
          depthCm: roundCm(depth),
          done: prev[selectedId]?.done ?? false,
          drawerCount: prev[selectedId]?.drawerCount,
        },
      };
      const kind = sectionDefs.find((s) => s.id === selectedId)?.kind;
      if (kind === "drawer") {
        return resyncAllDrawerFronts(template, widthCm, heightCm, thicknessMm, next);
      }
      return next;
    });
  }

  function setDrawerCount(count: number) {
    if (!selectedId) return;
    const sec = template.sections.find((s) => s.id === selectedId && s.kind === "drawer");
    if (!sec) return;
    const n = Math.max(1, Math.min(8, Math.round(count)));
    setSections((prev) => {
      const next = {
        ...prev,
        [selectedId]: {
          ...prev[selectedId],
          drawerCount: n,
        },
      };
      return resyncAllDrawerFronts(template, widthCm, heightCm, thicknessMm, next);
    });
  }

  function hideDoors() {
    setShowDoors(false);
    if (selectedId && isDoorSectionId(selectedId)) {
      setSelectedId(compartmentDefs[0]?.id ?? null);
    }
  }

  function saveSelectedSection() {
    if (!selectedId) return;
    setSections((prev) => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        done: true,
      },
    }));
  }

  const currentMeasure = selectedId
    ? {
        ...displaySections[selectedId],
        depthCm: displaySections[selectedId]?.depthCm ?? depthCm,
      }
    : null;

  const planToolbar = (
        <div className="plan-view-tools" role="toolbar" aria-label="Vista del plano">
          <button
            type="button"
            className={`btn btn-small plan-tool-btn${planView === "front" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setPlanView("front")}
            aria-pressed={planView === "front"}
          >
            Vista frontal
          </button>
          <button
            type="button"
            className={`btn btn-small plan-tool-btn${planView === "side" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setPlanView("side")}
            aria-pressed={planView === "side"}
          >
            Vista fondo (lateral)
          </button>
          <button
            type="button"
            className={`btn btn-small plan-tool-btn${planFocus === "zones" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => {
              setPlanView("front");
              setPlanFocus("zones");
            }}
            aria-pressed={planFocus === "zones" && planView === "front"}
          >
            Ver zonas
          </button>
          <button
            type="button"
            className={`btn btn-small plan-tool-btn${planFocus === "shelves-rods" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => {
              setPlanView("front");
              setPlanFocus("shelves-rods");
            }}
            aria-pressed={planFocus === "shelves-rods"}
            disabled={shelvesAndRods.length === 0}
            title={
              shelvesAndRods.length === 0
                ? "Este diseño no tiene piezas de lista de corte en el dibujo"
                : "Lados, tablas, tabiques y tubos"
            }
          >
            Lista de corte (dibujo)
          </button>
          <button
            type="button"
            className={`btn btn-small plan-tool-btn${showDoors ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setShowDoors(true)}
            disabled={template.doors === 0}
            title={template.doors === 0 ? "Este diseño no lleva puertas" : "Ver puertas en el dibujo (modo zonas)"}
            aria-pressed={showDoors}
          >
            Mostrar puertas
          </button>
          <button
            type="button"
            className={`btn btn-small plan-tool-btn${!showDoors ? " btn-primary" : " btn-ghost"}`}
            onClick={hideDoors}
            disabled={template.doors === 0}
            title={template.doors === 0 ? "Este diseño no lleva puertas" : "Quitar puertas para ver el interior"}
            aria-pressed={!showDoors}
          >
            Ocultar puertas
          </button>
          <p className="muted plan-touch-hint plan-touch-hint--full">
            {phase === "design"
              ? "Barra siempre visible: elige plantilla abajo y usa el dibujo para probar vistas. Luego «Empezar a medir»."
              : planFocus === "shelves-rods"
                ? "Lista de corte: mismas zonas de fondo + piezas encima. Toca el dibujo o las listas."
                : template.doors > 0 && !showDoors
                  ? "Puertas ocultas: mejor para medir interior. Puertas en la lista «Puertas»."
                  : "Toca un recuadro o una fila de la lista. Los botones quedan fijos arriba del plano."}
          </p>
        </div>
  );

  const preview = (
    <div className="designer-preview">
      {phase === "measure" ? planToolbar : null}
      <div className="designer-plan-wrap">
        {phase === "design" ? (
          <PlanBuilderCanvas
            template={template}
            onChange={(next) => setTemplate(syncTemplateMeta(next))}
            outerWidthCm={widthCm}
            outerHeightCm={heightCm}
            outerDepthCm={depthCm}
            thicknessMm={thicknessMm}
            onWidthChange={setWidthCm}
            onHeightChange={setHeightCm}
            onDepthChange={setDepthCm}
          />
        ) : planView === "side" ? (
          <ClosetSideView
            template={template}
            outerWidthCm={widthCm}
            outerHeightCm={heightCm}
            outerDepthCm={depthCm}
            thicknessMm={thicknessMm}
            sections={displaySections}
            selectedId={selectedId}
            onSelect={selectSection}
          />
        ) : (
          <PlanTouchStage
            template={template}
            outerWidthCm={widthCm}
            outerHeightCm={heightCm}
            sections={displaySections}
            selectedId={selectedId}
            showDoors={showDoors}
            planFocus={planFocus}
            depthCm={depthCm}
            thicknessMm={thicknessMm}
            onSelect={selectSection}
          />
        )}
      </div>
      {phase === "design" ? (
        <p className="plan-interactive-hint">
          <strong>Armador:</strong> coloca piezas y guarda el diseño. Luego «Listo, medir secciones» en el panel.
        </p>
      ) : selectedSection ? (
        <p className="plan-interactive-hint is-active">
          Seleccionado: <strong>{selectedSection.label}</strong>
        </p>
      ) : null}
      {plan ? (
        <p className="muted designer-progress">
          Avance: <strong>{plan.completedSteps}</strong> de {plan.totalSteps} secciones en verde
        </p>
      ) : null}
    </div>
  );

  const panel = (
        <div className="designer-panel">
          {phase === "design" ? <h3>Armar tu plano</h3> : <h3>Medir cada compartimento</h3>}

          {phase === "design" ? (
            <div className="designer-steps stack">
              <div className="category-tabs" role="tablist" aria-label="Tipo de mueble">
                {TEMPLATE_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={category === c.id}
                    className={`category-tab${category === c.id ? " active" : ""}`}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Nombre del diseño</span>
                <input
                  value={template.name}
                  onChange={(e) => setTemplate((t) => ({ ...t, name: e.target.value.slice(0, 80) }))}
                />
              </label>
              <label className="field">
                <span>Puertas al frente (0–4)</span>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={template.doors}
                  onChange={(e) => setTemplate((t) => setTemplateDoors(t, Number(e.target.value)))}
                />
              </label>
              <p className="design-meta">
                {template.sections.length} piezas en el armador · {template.doors} puertas · {template.rails} riel(es) ·{" "}
                {template.drawers} cajones (estimado)
              </p>
              <p className="muted">Medidas ancho/alto/fondo: arriba del dibujo del armador (siempre visibles).</p>
              <label className="field">
                <span>Material</span>
                <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="row-actions">
                <button type="button" className="btn btn-primary" onClick={saveCurrentPlan}>
                  Guardar diseño
                </button>
                <button type="button" className="btn btn-ghost" onClick={newBlankPlan}>
                  Nuevo en blanco
                </button>
              </div>
              {savedPlans.length > 0 ? (
                <ul className="saved-plans-list">
                  {savedPlans.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => loadPlan(p)}>
                        {p.name}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        aria-label={`Borrar ${p.name}`}
                        onClick={() => removeSavedPlan(p.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Los diseños guardados quedan en este navegador (taller).</p>
              )}
              <button type="button" className="btn btn-primary" onClick={startMeasuring} disabled={!material}>
                Listo, medir secciones →
              </button>
            </div>
          ) : (
            <div className="design-switcher stack">
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setPhase("design")}>
                ← Volver al armador
              </button>
              <CabinSizeFields
                widthCm={widthCm}
                heightCm={heightCm}
                depthCm={depthCm}
                onWidthChange={setWidthCm}
                onHeightChange={setHeightCm}
                onDepthChange={setDepthCm}
                cabin={cabinDims}
              />
              <div className="plan-dimensions-explainer" role="note">
                <strong>{template.name}</strong> · exterior {formatCm(widthCm)}×{formatCm(heightCm)} cm · interior ~{" "}
                {formatCm(cabinDims.innerWidthCm)}×{formatCm(cabinDims.innerHeightCm)} cm
              </div>
            </div>
          )}

          {phase === "measure" && selectedSection && currentMeasure ? (
            <div className="stack">
              <p className="section-callout">
                <strong>{selectedSection.label}</strong>
                <br />
                {selectedSection.hint}
              </p>
              <div className="measure-fields">
                <label className="field">
                  <span>{fieldLabels.a}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={1}
                    value={currentMeasure.widthCm}
                    onChange={(e) =>
                      updateSelected(Number(e.target.value), currentMeasure.heightCm, currentMeasure.depthCm)
                    }
                  />
                </label>
                <label className="field">
                  <span>{fieldLabels.b}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={0.4}
                    value={currentMeasure.heightCm}
                    onChange={(e) =>
                      updateSelected(currentMeasure.widthCm, Number(e.target.value), currentMeasure.depthCm)
                    }
                  />
                </label>
                <label className="field">
                  <span>{fieldLabels.c}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    min={0.4}
                    value={currentMeasure.depthCm}
                    onChange={(e) =>
                      updateSelected(currentMeasure.widthCm, currentMeasure.heightCm, Number(e.target.value))
                    }
                  />
                </label>
              </div>
              <p className="muted plan-live-hint">
                Al escribir, el <strong>relleno naranja</strong> y el tamaño del recuadro cambian con ancho y alto; la
                franja <strong>azul</strong> es el fondo. <strong>Vista fondo (lateral)</strong> en la barra del plano.
              </p>
              {selectedSection?.kind === "drawer" && currentMeasure ? (
                <div className="drawer-count-block">
                  <label className="field">
                    <span>Cantidad de cajones en esta zona</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={8}
                      value={currentMeasure.drawerCount ?? 3}
                      onChange={(e) => setDrawerCount(Number(e.target.value))}
                    />
                  </label>
                  <p className="muted">
                    Alto calculado por cajón:{" "}
                    <strong>
                      {formatCm(drawerHeightCm(currentMeasure, currentMeasure.drawerCount ?? 3))} cm
                    </strong>{" "}
                    (con separación entre frentes). Cada frente aparece en el dibujo y en «Frentes de cajón».
                  </p>
                </div>
              ) : null}
              {selectedSection &&
              template.sections.some(
                (s) => s.id === selectedSection.id && ["shelf", "cubbie", "top"].includes(s.kind),
              ) ? (
                <p className="muted">
                  Las <strong>tablas de repisa</strong> y los <strong>tubos</strong> están en «Repisas y tubos» abajo, o en
                  el dibujo con «Lista de corte (dibujo)».
                </p>
              ) : null}
              <button
                type="button"
                className={`btn btn-primary${currentMeasure.done ? " btn-ghost" : ""}`}
                onClick={saveSelectedSection}
              >
                {currentMeasure.done ? "Volver a guardar medida" : "Guardar esta sección ✓"}
              </button>
              {allDone && plan ? (
                <div className="stack done-banner">
                  <p className="price-tag">{money(plan.priceEstimateMxn)} estimado</p>
                  <div className="row-actions">
                    <button type="button" className="btn btn-primary" onClick={() => downloadPlanHtml(plan)}>
                      Descargar plano (HTML)
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                      Imprimir / PDF
                    </button>
                  </div>
                </div>
              ) : (
                <p className="muted">Faltan secciones pendientes (rojo en el dibujo). Puedes saltar a otra cuando quieras.</p>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => {
                  if (!confirmDiscardMeasures()) return;
                  resetMeasuresAfterTemplateChange();
                }}
              >
                Borrar medidas y empezar de cero
              </button>
            </div>
          ) : phase === "measure" ? (
            <p className="muted">Haz clic en una sección del plano o en la tabla de abajo.</p>
          ) : null}
        </div>
  );

  return (
    <div className="designer">
      <div className={`designer-layout${phase === "measure" ? " is-editing" : ""}`}>
        {preview}
        {panel}
      </div>

      {phase === "measure" ? (
        <div className="section-picker-groups">
          <details className="picker-group" open>
            <summary>1. Zonas del diseño (coinciden con el dibujo)</summary>
            <SectionPicker
              rows={compartmentDefs}
              displaySections={displaySections}
              selectedId={selectedId}
              onSelect={selectSection}
            />
          </details>

          {drawerFrontDefs.length > 0 ? (
            <details className="picker-group" open>
              <summary>Frentes de cajón ({drawerFrontDefs.length})</summary>
              <p className="muted table-hint">
                Cambia la cantidad en la zona de cajones; aquí mides o revisas cada frente.
              </p>
              <SectionPicker
                rows={drawerFrontDefs}
                displaySections={displaySections}
                selectedId={selectedId}
                onSelect={selectSection}
              />
            </details>
          ) : null}

          {shelvesAndRods.length > 0 ? (
            <details className="picker-group" open>
              <summary>2. Tablas, lados, tabiques y tubos</summary>
              <p className="muted table-hint">
                Incluye <strong>costados, tapa, base, zócalo</strong>, tablas interiores, tabiques y tubos. En el dibujo
                verás el <strong>nombre</strong> y las <strong>medidas</strong> en cada pieza.
              </p>
              <h5 className="shelf-zone-title">Lados, tapa y base ({carcassFaceDefs.length})</h5>
              <SectionPicker
                rows={carcassFaceDefs}
                displaySections={displaySections}
                selectedId={selectedId}
                onSelect={(id) => {
                  setPlanFocus("shelves-rods");
                  selectSection(id);
                }}
              />
              {shelfBoardDefs.length > 0 ? (
                <>
                  <h5 className="shelf-zone-title">Tablas horizontales ({shelfBoardDefs.length})</h5>
                  <SectionPicker
                    rows={shelfBoardDefs}
                    displaySections={displaySections}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      setPlanFocus("shelves-rods");
                      selectSection(id);
                    }}
                  />
                </>
              ) : null}
              {dividerDefs.length > 0 ? (
                <>
                  <h5 className="shelf-zone-title">Tabiques verticales ({dividerDefs.length})</h5>
                  <SectionPicker
                    rows={dividerDefs}
                    displaySections={displaySections}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      setPlanFocus("shelves-rods");
                      selectSection(id);
                    }}
                  />
                </>
              ) : null}
              {rodDefs.length > 0 ? (
                <>
                  <h5 className="shelf-zone-title">Tubos / rieles ({rodDefs.length})</h5>
                  <SectionPicker
                    rows={rodDefs}
                    displaySections={displaySections}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      setPlanFocus("shelves-rods");
                      selectSection(id);
                    }}
                  />
                </>
              ) : null}
            </details>
          ) : null}

          {doorDefs.length > 0 ? (
            <details className="picker-group">
              <summary>3. Puertas</summary>
              <SectionPicker
                rows={doorDefs}
                displaySections={displaySections}
                selectedId={selectedId}
                onSelect={selectSection}
              />
            </details>
          ) : null}

          {surroundDefs.length > 0 ? (
            <details className="picker-group">
              <summary>4. Respaldo (no visible en el frente)</summary>
              <SectionPicker
                rows={surroundDefs}
                displaySections={displaySections}
                selectedId={selectedId}
                onSelect={selectSection}
              />
            </details>
          ) : null}
        </div>
      ) : null}

      {plan && phase === "measure" ? (
        <details className="plan-parts-fold" open>
          <summary>Lista completa de piezas ({plan.parts.length}) — carcasa, puertas e interiores</summary>
          <p className="muted part-groups-intro">
            Basado en listas tipo{" "}
            <a href="https://cutnest.co.uk/wardrobe-cutting-list.html" target="_blank" rel="noreferrer">
              CutNest
            </a>{" "}
            y{" "}
            <a href="https://plymap.com/plans/two-door-wardrobe/" target="_blank" rel="noreferrer">
              Plymap
            </a>
            : costados, tapa, fondo, tabiques, puertas y cajones.
          </p>
          {plan.partGroups.map((group) => (
            <div key={group.id} className="part-group-block">
              <h4>{group.label}</h4>
              <PartTable parts={group.parts} />
            </div>
          ))}
          <h4>Herrajes aproximados</h4>
          <ul className="supply-list">
            {plan.supplies.map((s) => (
              <li key={s.name}>
                <strong>{s.qty}</strong> {s.unit} · {s.name}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}