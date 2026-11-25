"use client";

import type { SyntheticEvent } from "react";
import { useMemo } from "react";
import {
  accessoryLayoutBoxes,
  defaultSectionMeasures,
  getLayoutGeometry,
  scaleLayoutBoxToMeasure,
  type ClosetTemplate,
  type SectionMeasure,
} from "@/lib/closet-design";
import { ClosetElevation } from "@/components/ClosetElevation";

type Props = {
  template: ClosetTemplate;
  outerWidthCm: number;
  outerHeightCm: number;
  sections: Record<string, SectionMeasure>;
  selectedId: string | null;
  showDoors: boolean;
  planFocus?: "zones" | "shelves-rods";
  depthCm?: number;
  thicknessMm?: number;
  onSelect: (id: string) => void;
};

function tapTargetPct(
  layoutW: number,
  layoutH: number,
  w: number,
  h: number,
  kind: string,
) {
  if (kind === "carcass") {
    const vert = h > w * 1.2;
    if (vert) {
      return {
        wPct: (Math.max(w, 32) / layoutW) * 100,
        hPct: (h / layoutH) * 100,
      };
    }
    return {
      wPct: (w / layoutW) * 100,
      hPct: (Math.max(h, 28) / layoutH) * 100,
    };
  }
  if (kind === "divider") {
    const minW = Math.max(w, 28);
    return {
      wPct: (minW / layoutW) * 100,
      hPct: (h / layoutH) * 100,
    };
  }
  const thin = kind === "shelf-board" || kind === "rod";
  if (thin) {
    const minW = Math.max(w, 56);
    const minH = Math.max(h, 12);
    return {
      wPct: (minW / layoutW) * 100,
      hPct: (Math.min(minH, 40) / layoutH) * 100,
    };
  }
  const minW = Math.max(w, 72);
  const minH = Math.max(h, 72);
  return {
    wPct: (minW / layoutW) * 100,
    hPct: (minH / layoutH) * 100,
  };
}

function selectZone(id: string, onSelect: (id: string) => void, ev: SyntheticEvent) {
  ev.preventDefault();
  ev.stopPropagation();
  onSelect(id);
}

export function PlanTouchStage({
  template,
  outerWidthCm,
  outerHeightCm,
  sections,
  selectedId,
  showDoors,
  planFocus = "zones",
  depthCm = 60,
  thicknessMm = 18,
  onSelect,
}: Props) {
  const reference = useMemo(
    () => defaultSectionMeasures(template, outerWidthCm, outerHeightCm, depthCm, thicknessMm),
    [template, outerWidthCm, outerHeightCm, depthCm, thicknessMm],
  );
  const layout = getLayoutGeometry(template, outerWidthCm, outerHeightCm);
  const aspect = (layout.viewH / layout.viewW) * 100;
  const zoneTargets = showDoors ? [...layout.innerBoxes, ...layout.doorBoxes] : layout.innerBoxes;
  const rawTargets =
    planFocus === "shelves-rods"
      ? accessoryLayoutBoxes(template, outerWidthCm, outerHeightCm)
      : zoneTargets;
  const targets = rawTargets.map((box) => {
    const m = sections[box.id];
    const ref = reference[box.id];
    if (m && ref) return scaleLayoutBoxToMeasure(box, m, ref);
    return box;
  });

  return (
    <div className="plan-touch-stage">
      <div className="plan-touch-aspect" style={{ paddingBottom: `${aspect}%` }}>
        <div className="plan-touch-fill">
          <ClosetElevation
            template={template}
            outerWidthCm={outerWidthCm}
            outerHeightCm={outerHeightCm}
            sections={sections}
            selectedId={selectedId}
            onSelect={onSelect}
            showDoors={showDoors}
            planFocus={planFocus}
            depthCm={depthCm}
            thicknessMm={thicknessMm}
            decorOnly
          />
          <div className="plan-touch-overlay" aria-hidden>
            {targets.map((box) => {
              if (!sections[box.id]) return null;
              let left = (box.x / layout.viewW) * 100;
              let top = (box.y / layout.viewH) * 100;
              let width = (box.w / layout.viewW) * 100;
              let height = (box.h / layout.viewH) * 100;
              const ms = tapTargetPct(layout.viewW, layout.viewH, box.w, box.h, box.kind);
              if (ms.wPct > width) {
                left = left + width / 2 - ms.wPct / 2;
                width = ms.wPct;
              }
              const maxTapHeight =
                box.kind === "divider"
                  ? ms.hPct
                  : box.kind === "shelf-board" || box.kind === "rod"
                    ? 14
                    : ms.hPct;
              const useH = Math.min(ms.hPct, maxTapHeight);
              if (useH > height) {
                top = top + height / 2 - useH / 2;
                height = useH;
              }
              const selected = box.id === selectedId;
              const done = sections[box.id]?.done;
              return (
                <button
                  key={box.id}
                  type="button"
                  className={`plan-zone-tap${selected ? " is-selected" : ""}${done ? " is-done" : ""}${box.kind === "door" ? " is-door" : ""}${box.kind === "shelf-board" ? " is-shelf-board" : ""}${box.kind === "rod" ? " is-rod" : ""}${box.kind === "divider" ? " is-divider" : ""}${box.kind === "carcass" ? " is-carcass" : ""}`}
                  style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                  aria-label={box.label}
                  aria-pressed={selected}
                  onPointerUp={(ev) => {
                    if (ev.pointerType === "mouse" && ev.button !== 0) return;
                    selectZone(box.id, onSelect, ev);
                  }}
                  onClick={(ev) => selectZone(box.id, onSelect, ev)}
                >
                  <span className="visually-hidden">{box.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}