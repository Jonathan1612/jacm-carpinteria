"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  BUILDER_GRID,
  BUILDER_PIECES,
  addPieceAt,
  moveSection,
  removeSection,
  resizeSection,
  sectionSizeCm,
  setSectionDrawerCount,
  type BuilderPiece,
} from "@/lib/plan-builder";
import { cabinDimensionSummary, formatCm } from "@/lib/closet-design";
import type { ClosetTemplate } from "@/lib/closet-design";
import { BuilderBlockGlyph, PaletteGlyph } from "@/components/plan-builder-glyphs";
import { CabinSizeFields } from "@/components/CabinSizeFields";
import { PieceSizeFields } from "@/components/PieceSizeFields";

type Props = {
  template: ClosetTemplate;
  onChange: (next: ClosetTemplate) => void;
  outerWidthCm: number;
  outerHeightCm: number;
  outerDepthCm: number;
  thicknessMm?: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  onDepthChange: (v: number) => void;
};

export function PlanBuilderCanvas({
  template,
  onChange,
  outerWidthCm,
  outerHeightCm,
  outerDepthCm,
  thicknessMm = 18,
  onWidthChange,
  onHeightChange,
  onDepthChange,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState<BuilderPiece | null>(null);
  const [armedDrawerCount, setArmedDrawerCount] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; offsetFx: number; offsetFy: number } | null>(null);

  const cabin = useMemo(
    () => cabinDimensionSummary(outerWidthCm, outerHeightCm, thicknessMm),
    [outerWidthCm, outerHeightCm, thicknessMm],
  );

  const selectedSec = template.sections.find((s) => s.id === selectedId) ?? null;
  const selectedSize = selectedSec
    ? sectionSizeCm(selectedSec, outerWidthCm, outerHeightCm, thicknessMm, outerDepthCm)
    : null;

  const showMsg = useCallback((text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(null), 2800);
  }, []);

  function fractionFromEvent(clientX: number, clientY: number) {
    const el = canvasRef.current;
    if (!el) return { fx: 0, fy: 0 };
    const r = el.getBoundingClientRect();
    return { fx: (clientX - r.left) / r.width, fy: (clientY - r.top) / r.height };
  }

  function placePiece(piece: BuilderPiece, fx: number, fy: number) {
    const withDrawers =
      piece.kind === "drawer" ? { ...piece, drawerDefault: armedDrawerCount } : piece;
    const next = addPieceAt(template, withDrawers, fx - piece.fw / 2, fy - piece.fh / 2);
    if ("error" in next) {
      showMsg(next.error);
      return;
    }
    onChange(next);
    setArmed(null);
  }

  function onCanvasPointerUp(e: React.PointerEvent) {
    if (drag || !armed) return;
    const { fx, fy } = fractionFromEvent(e.clientX, e.clientY);
    placePiece(armed, fx, fy);
  }

  function onBlockPointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    const block = (e.currentTarget as HTMLElement);
    setSelectedId(id);
    const { fx, fy } = fractionFromEvent(e.clientX, e.clientY);
    const sec = template.sections.find((s) => s.id === id);
    if (!sec) return;
    setDrag({ id, offsetFx: fx - sec.fx, offsetFy: fy - sec.fy });
    block.setPointerCapture(e.pointerId);
  }

  function onBlockPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const { fx, fy } = fractionFromEvent(e.clientX, e.clientY);
    const moved = moveSection(template, drag.id, fx - drag.offsetFx, fy - drag.offsetFy);
    if (!("error" in moved)) onChange(moved);
  }

  function onBlockPointerUp(e: React.PointerEvent) {
    if (!drag) return;
    setDrag(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function nudgeResize(dw: number, dh: number) {
    if (!selectedId) return;
    const next = resizeSection(template, selectedId, dw, dh);
    if ("error" in next) showMsg(next.error);
    else onChange(next);
  }

  function deleteSelected() {
    if (!selectedId) return;
    if (selectedId === "footer" && template.sections.length === 1) {
      showMsg("Deja al menos el zócalo o agrega otras piezas primero.");
      return;
    }
    onChange(removeSection(template, selectedId));
    setSelectedId(null);
  }

  return (
    <div className="plan-builder">
      <CabinSizeFields
        widthCm={outerWidthCm}
        heightCm={outerHeightCm}
        depthCm={outerDepthCm}
        onWidthChange={onWidthChange}
        onHeightChange={onHeightChange}
        onDepthChange={onDepthChange}
        cabin={cabin}
        compact
      />
      <p className="plan-builder-help">
        El marco café = costados. El beige = interior. Las medidas de cada pieza son <strong>los cm que escribes</strong> (sin
        quitar tableros); el bloque solo se escala para caber en el dibujo.
      </p>
      {msg ? (
        <p className="plan-builder-msg" role="status">
          {msg}
        </p>
      ) : null}
      <div className="plan-builder-palette" role="toolbar" aria-label="Componentes">
        {BUILDER_PIECES.map((piece) => (
          <button
            key={piece.kind + piece.label}
            type="button"
            className={`plan-builder-palette-btn${armed?.kind === piece.kind && armed.label === piece.label ? " is-armed" : ""}`}
            onClick={() => setArmed(piece)}
            aria-pressed={armed?.kind === piece.kind}
          >
            <PaletteGlyph kind={piece.kind} />
            <span>{piece.label}</span>
          </button>
        ))}
      </div>
      {armed?.kind === "drawer" ? (
        <label className="field plan-builder-drawer-pick">
          <span>Cantidad de cajones en este bloque</span>
          <input
            type="number"
            min={1}
            max={8}
            value={armedDrawerCount}
            onChange={(e) => setArmedDrawerCount(Number(e.target.value))}
          />
        </label>
      ) : null}
      {selectedId && selectedSec && selectedSize ? (
        <PieceSizeFields
          sectionId={selectedId}
          section={selectedSec}
          sizes={selectedSize}
          template={template}
          outerWidthCm={outerWidthCm}
          outerHeightCm={outerHeightCm}
          outerDepthCm={outerDepthCm}
          thicknessMm={thicknessMm}
          onTemplateChange={onChange}
          onError={showMsg}
        />
      ) : null}
      {selectedId ? (
        <div className="plan-builder-selection">
          {selectedSec?.kind === "drawer" ? (
            <label className="field plan-builder-drawer-pick inline">
              <span>Cajones</span>
              <input
                type="number"
                min={1}
                max={8}
                value={selectedSec.drawerDefault ?? 3}
                onChange={(e) =>
                  onChange(setSectionDrawerCount(template, selectedId, Number(e.target.value)))
                }
              />
            </label>
          ) : null}
          <button type="button" className="btn btn-small btn-ghost" onClick={() => nudgeResize(1 / BUILDER_GRID.cols, 0)}>
            + ancho
          </button>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => nudgeResize(-1 / BUILDER_GRID.cols, 0)}>
            − ancho
          </button>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => nudgeResize(0, 1 / BUILDER_GRID.rows)}>
            + alto
          </button>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => nudgeResize(0, -1 / BUILDER_GRID.rows)}>
            − alto
          </button>
          <button type="button" className="btn btn-small btn-ghost" onClick={deleteSelected}>
            Quitar
          </button>
        </div>
      ) : null}
      <div className="plan-builder-scale-wrap">
        <span className="plan-builder-ruler plan-builder-ruler--v" aria-hidden>
          {formatCm(outerHeightCm)} cm
        </span>
        <div
          ref={canvasRef}
          className={`plan-builder-canvas${armed ? " is-armed" : ""}`}
          style={{ aspectRatio: `${outerWidthCm} / ${outerHeightCm}` }}
          onPointerUp={onCanvasPointerUp}
          role="application"
          aria-label="Interior del mueble: suelta componentes aquí"
        >
          <div className="plan-builder-inner">
          <div className="plan-builder-grid" aria-hidden />
          {template.sections.map((sec) => (
            <div
              key={sec.id}
              className={`plan-builder-block kind-${sec.kind}${selectedId === sec.id ? " is-selected" : ""}`}
              style={{
                left: `${sec.fx * 100}%`,
                top: `${sec.fy * 100}%`,
                width: `${sec.fw * 100}%`,
                height: `${sec.fh * 100}%`,
              }}
              onPointerDown={(ev) => onBlockPointerDown(ev, sec.id)}
              onPointerMove={onBlockPointerMove}
              onPointerUp={onBlockPointerUp}
            >
              <BuilderBlockGlyph kind={sec.kind} drawerCount={sec.drawerDefault ?? 3} />
              <span className="plan-builder-block-label">{sec.label}</span>
            </div>
          ))}
          </div>
        </div>
        <span className="plan-builder-ruler plan-builder-ruler--h" aria-hidden>
          {formatCm(outerWidthCm)} cm (ancho exterior)
        </span>
      </div>
    </div>
  );
}