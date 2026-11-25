"use client";

import { useMemo } from "react";
import {
  accessoryLayoutBoxes,
  carcassFrameLayoutBoxes,
  clampMeasureRatio,
  defaultSectionMeasures,
  depthBarWidth,
  drawerCountForBlock,
  drawerHeightCm,
  formatCm,
  cabinDimensionSummary,
  getLayoutGeometry,
  interiorDividerSectionDefs,
  scaleLayoutBoxToMeasure,
  shortPlanLabel,
  type SectionKind,
  type SectionMeasure,
} from "@/lib/closet-design";
import type { ClosetTemplate } from "@/lib/closet-design";
import type { LayoutBox } from "@/lib/closet-design";
import { PlanSvgLabel, planLabelInset, planMeasureLines } from "@/components/plan-labels";

function labelClipId(boxId: string) {
  return `lbl-${boxId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

type Props = {
  template: ClosetTemplate;
  outerWidthCm: number;
  outerHeightCm: number;
  sections: Record<string, SectionMeasure>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  interactive?: boolean;
  showDoors?: boolean;
  decorOnly?: boolean;
  planFocus?: "zones" | "shelves-rods";
  depthCm?: number;
  thicknessMm?: number;
};

const fills: Record<SectionKind, string> = {
  top: "#ebe4da",
  cubbie: "#f5efe8",
  hang: "#e8ddd0",
  shelf: "#efe8df",
  drawer: "#d9c9b4",
  "drawer-front": "#e0cdb0",
  tall: "#e2d6c8",
  footer: "#c8b49a",
  door: "#c4a882",
  carcass: "#6d4528",
  "shelf-board": "#c9a87c",
  divider: "#a89080",
  rod: "#8d5a32",
};

function zoneTitle(box: LayoutBox) {
  return shortPlanLabel(box.label);
}

export function ClosetElevation({
  template,
  outerWidthCm,
  outerHeightCm,
  sections,
  selectedId,
  onSelect,
  interactive = true,
  showDoors = true,
  decorOnly = false,
  planFocus = "zones",
  depthCm = 60,
  thicknessMm = 18,
}: Props) {
  const referenceSections = useMemo(
    () => defaultSectionMeasures(template, outerWidthCm, outerHeightCm, depthCm, thicknessMm),
    [template, outerWidthCm, outerHeightCm, depthCm, thicknessMm],
  );
  const layout = getLayoutGeometry(template, outerWidthCm, outerHeightCm);
  const cabin = useMemo(
    () => cabinDimensionSummary(outerWidthCm, outerHeightCm, thicknessMm),
    [outerWidthCm, outerHeightCm, thicknessMm],
  );
  const dividerStrips = useMemo(() => {
    const { ox, oy, frame, innerW, innerH } = layout;
    return interiorDividerSectionDefs(template).map((sec) => ({
      id: sec.id,
      x: ox + frame + sec.fx * innerW,
      y: oy + frame + sec.fy * innerH,
      w: Math.max(sec.fw * innerW, 2),
      h: sec.fh * innerH,
    }));
  }, [layout, template]);
  const doorBoxes = showDoors ? layout.doorBoxes : [];
  const frameBoxes = carcassFrameLayoutBoxes(template, outerWidthCm, outerHeightCm);
  const accessories =
    planFocus === "shelves-rods"
      ? accessoryLayoutBoxes(template, outerWidthCm, outerHeightCm)
      : [];
  const zonesMuted = planFocus === "shelves-rods";

  function vizBox(box: LayoutBox): LayoutBox {
    const m = sections[box.id];
    const ref = referenceSections[box.id];
    if (!m || !ref) return box;
    return scaleLayoutBoxToMeasure(box, m, ref);
  }

  function measureFill(viz: LayoutBox, m: SectionMeasure, ref: SectionMeasure) {
    const rw = clampMeasureRatio(m.widthCm / ref.widthCm, 0.15, 1);
    const rh = clampMeasureRatio(m.heightCm / ref.heightCm, 0.15, 1);
    const fw = viz.w * 0.9 * rw;
    const fh = viz.h * 0.9 * rh;
    return (
      <rect
        x={viz.x + (viz.w - fw) / 2}
        y={viz.y + (viz.h - fh) / 2}
        width={fw}
        height={fh}
        fill="rgba(197, 106, 45, 0.22)"
        stroke="rgba(197, 106, 45, 0.45)"
        strokeWidth="1"
        rx="2"
        pointerEvents="none"
      />
    );
  }

  function depthStrip(viz: LayoutBox, m: SectionMeasure, ref: SectionMeasure) {
    if (viz.h < 26) return null;
    const w = depthBarWidth(viz.w, m.depthCm ?? ref.depthCm, ref.depthCm);
    return (
      <rect
        x={viz.x + (viz.w - w) / 2}
        y={viz.y + viz.h - 5}
        width={w}
        height={3}
        fill="rgba(90, 140, 175, 0.75)"
        rx="1"
        pointerEvents="none"
      />
    );
  }

  function zonePlanLabel(
    boxId: string,
    viz: { x: number; y: number; w: number; h: number },
    title: string,
    lines: string[],
    opts: {
    selected?: boolean;
    done?: boolean;
    light?: boolean;
    withDepth?: boolean;
    measuresOnly?: boolean;
    vertical?: boolean;
  }) {
    if (viz.w < 16 || viz.h < 14) return null;
    const inset = planLabelInset(viz, opts.withDepth ? 9 : 4);
    return (
      <PlanSvgLabel
        x={inset.anchorX}
        y={inset.anchorY}
        title={title}
        lines={lines}
        selected={opts.selected}
        done={opts.done}
        light={opts.light}
        vertical={opts.vertical}
        maxWidth={inset.maxWidth}
        maxHeight={inset.maxHeight}
        clipId={labelClipId(boxId)}
        clipX={inset.clipX}
        clipY={inset.clipY}
        clipW={inset.clipW}
        clipH={inset.clipH}
        measuresOnly={opts.measuresOnly}
      />
    );
  }

  function renderZone(box: LayoutBox, layer: "inner" | "door") {
    const m = sections[box.id];
    if (!m) return null;
    const ref = referenceSections[box.id];
    const viz = vizBox(box);
    const isDoor = layer === "door";
    const selected = box.id === selectedId;
    const done = m.done;
    const stroke = selected ? "#f8e7c8" : done ? "#a8d4b8" : isDoor ? "#e8dcc8" : "#d9cbb8";
    const sw = selected ? 3 : done ? 2 : 1.5;
    const fill = done ? "#fff3e4" : fills[box.kind];
    const lines = planMeasureLines(m, box.kind);
    const title = isDoor ? zoneTitle(box).replace(/^Puerta /, "Puerta ") : zoneTitle(box);
    const parentSec = template.sections.find((s) => s.id === box.id);

    const drawerLayers =
      box.kind === "drawer" && parentSec ? (() => {
        const n = drawerCountForBlock(parentSec, template, sections);
        const gap = 5;
        const slotH = (viz.h - gap * (n + 1)) / n;
        const eachCm = drawerHeightCm(m, n);
        return (
          <>
            <rect
              x={viz.x}
              y={viz.y}
              width={viz.w}
              height={viz.h}
              fill="#ebe3d6"
              stroke={stroke}
              strokeWidth={sw}
              rx="3"
            />
            {ref ? measureFill(viz, m, ref) : null}
            {ref ? depthStrip(viz, m, ref) : null}
            {Array.from({ length: n }, (_, i) => {
              const sy = viz.y + gap + i * (slotH + gap);
              const slotSelected = selected;
              return (
                <g key={i}>
                  <rect
                    x={box.x + 4}
                    y={sy}
                    width={viz.w - 8}
                    height={slotH}
                    fill={done ? "#d4e8dc" : "#e0cdb0"}
                    stroke={slotSelected ? "#c56a2d" : "#a08060"}
                    strokeWidth={slotSelected ? 2 : 1}
                    rx="2"
                  />
                  <circle cx={viz.x + viz.w - 14} cy={sy + slotH / 2} r="3" fill="#6a4c34" />
                  {slotH >= 22 ? (
                    <text
                      x={viz.x + viz.w / 2}
                      y={sy + slotH / 2 + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="600"
                      fill="#3d2a1a"
                    >
                      Cajón {i + 1} · {formatCm(m.widthCm)}×{formatCm(eachCm)}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {zonePlanLabel(box.id, viz, title, [`${n} caj. · ${formatCm(eachCm)} c/u`], {
              selected,
              done,
              withDepth: !!ref,
            })}
          </>
        );
      })() : null;

    const inner = drawerLayers ?? (
      <>
        <rect
          x={viz.x - (viz.w - box.w) / 2}
          y={viz.y - (viz.h - box.h) / 2}
          width={box.w}
          height={box.h}
          fill="none"
          stroke="#d9cbb8"
          strokeWidth="1"
          strokeDasharray="4 3"
          rx="3"
          opacity={0.55}
        />
        <rect
          x={viz.x}
          y={viz.y}
          width={viz.w}
          height={viz.h}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          opacity={0.92}
          rx="3"
        />
        {ref ? measureFill(viz, m, ref) : null}
        {ref ? depthStrip(viz, m, ref) : null}
        {box.kind === "hang" && viz.h >= 36 ? (
          <line
            x1={viz.x + 8}
            y1={viz.y + viz.h * 0.22}
            x2={viz.x + viz.w - 8}
            y2={viz.y + viz.h * 0.22}
            stroke="#6a4c34"
            strokeWidth="2"
            opacity={0.55}
          />
        ) : null}
        {zonePlanLabel(box.id, viz, title, lines, {
          selected,
          done,
          withDepth: !!ref,
        })}
      </>
    );

    if (decorOnly) {
      return (
        <g key={box.id} opacity={zonesMuted ? 0.42 : 1} pointerEvents="none">
          {zonesMuted ? (
            <>
              <rect
                x={viz.x}
                y={viz.y}
                width={viz.w}
                height={viz.h}
                fill={fill}
                stroke="#d9cbb8"
                strokeWidth={1}
                rx="3"
              />
              {zonePlanLabel(box.id, viz, title, [], { done, withDepth: false })}
            </>
          ) : (
            inner
          )}
        </g>
      );
    }

    return (
      <g
        key={box.id}
        className={`section-hit${isDoor ? " is-door" : ""}${selected ? " is-selected" : ""}${done ? " is-done" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(box.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(box.id);
          }
        }}
      >
        {inner}
      </g>
    );
  }

  function renderFrameLabel(box: LayoutBox) {
    const m = sections[box.id];
    if (!m) return null;
    const selected = box.id === selectedId;
    const done = m.done;
    const vertical = box.h > box.w * 1.4;
    const vizFrame = { x: box.x, y: box.y, w: box.w, h: box.h };
    const lines = planMeasureLines(m, "carcass");
    return (
      <g key={`frame-lbl-${box.id}`}>
        {zonePlanLabel(box.id, vizFrame, shortPlanLabel(box.label), lines, {
          selected,
          done,
          light: true,
          vertical,
        })}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${layout.viewW} ${layout.viewH}`}
      className={`elevation-svg${decorOnly ? " is-decor" : interactive ? " is-interactive" : " is-preview"}`}
      role="img"
      aria-hidden={decorOnly ? true : undefined}
      aria-label="Plano frontal del mueble"
    >
      <rect width="100%" height="100%" fill="#fbf7f1" />
      <rect x={layout.ox} y={layout.oy} width={layout.rw} height={layout.rh} fill="#8d5a32" rx="4" />
      <rect
        x={layout.ox + layout.frame}
        y={layout.oy + layout.frame}
        width={layout.innerW}
        height={layout.innerH}
        fill="#f7f1e8"
      />
      <text
        x={layout.ox + layout.frame + 4}
        y={layout.oy + layout.frame + 11}
        fontSize="9"
        fill="#6b5d4f"
        pointerEvents="none"
      >
        Interior útil ~{formatCm(cabin.innerWidthCm)}×{formatCm(cabin.innerHeightCm)} cm · marco café = costados (
        {formatCm(cabin.sidePanelCm)} cm c/u)
      </text>

      {planFocus === "zones"
        ? dividerStrips.map((d) => (
            <rect
              key={d.id}
              x={d.x}
              y={d.y}
              width={d.w}
              height={d.h}
              fill="#c4b5a8"
              stroke="#8a7060"
              strokeWidth="0.75"
              opacity={0.55}
              pointerEvents="none"
            />
          ))
        : null}

      {layout.innerBoxes.map((box) => renderZone(box, "inner"))}
      {doorBoxes.map((box) => renderZone(box, "door"))}

      {planFocus === "zones" ? frameBoxes.map((box) => renderFrameLabel(box)) : null}

      {accessories.map((box) => {
        const m = sections[box.id];
        if (!m) return null;
        const viz = vizBox(box);
        const selected = box.id === selectedId;
        const done = m.done;
        const stroke = selected ? "#c56a2d" : done ? "#1f7a4d" : "#5c4030";
        const sw = selected ? 3 : done ? 2.5 : 2;
        const title = shortPlanLabel(box.label);
        const lines = planMeasureLines(m, box.kind);

        if (box.kind === "carcass") {
          const vertical = viz.h > viz.w * 1.4;
          return (
            <g key={box.id}>
              <rect
                x={viz.x}
                y={viz.y}
                width={viz.w}
                height={viz.h}
                fill={selected || done ? "rgba(197, 106, 45, 0.55)" : "rgba(197, 106, 45, 0.35)"}
                stroke={stroke}
                strokeWidth={sw}
                rx="2"
              />
              {referenceSections[box.id] ? measureFill(viz, m, referenceSections[box.id]) : null}
              {zonePlanLabel(box.id, viz, title, lines, {
                selected,
                done,
                light: true,
                vertical,
              })}
            </g>
          );
        }

        if (box.kind === "divider") {
          return (
            <g key={box.id}>
              <rect
                x={viz.x}
                y={viz.y}
                width={Math.max(viz.w, 2)}
                height={viz.h}
                fill={done ? "#ddd0c4" : "#a89080"}
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.92}
                rx="1"
              />
              {referenceSections[box.id] ? measureFill(viz, m, referenceSections[box.id]) : null}
              {zonePlanLabel(box.id, viz, title, lines, {
                selected,
                done,
                vertical: true,
              })}
            </g>
          );
        }

        if (box.kind === "rod") {
          const cy = viz.y + viz.h / 2;
          return (
            <g key={box.id}>
              <line
                x1={viz.x}
                y1={cy}
                x2={viz.x + viz.w}
                y2={cy}
                stroke={stroke}
                strokeWidth={sw + 1}
                strokeLinecap="round"
              />
              {zonePlanLabel(box.id, viz, title, lines, {
                selected,
                done,
                measuresOnly: viz.h < 14,
                withDepth: false,
              })}
            </g>
          );
        }

        const cy = viz.y + viz.h / 2;
        const thin = viz.h < 18;
        return (
          <g key={box.id}>
            <rect
              x={viz.x}
              y={viz.y}
              width={viz.w}
              height={Math.max(viz.h, 3)}
              fill={done ? "#d4e8dc" : "#c9a87c"}
              stroke={stroke}
              strokeWidth={sw}
              rx="1"
            />
            <line x1={viz.x} y1={cy} x2={viz.x + viz.w} y2={cy} stroke="#4e2f1c" strokeWidth="1" opacity={0.4} />
            {zonePlanLabel(box.id, viz, title, lines, {
              selected,
              done,
              measuresOnly: thin,
              withDepth: false,
            })}
          </g>
        );
      })}

      <text x={layout.ox} y={layout.oy + layout.rh + 24} fontSize="11" fill="#5c5146" pointerEvents="none">
        {planFocus === "shelves-rods"
          ? "Mismo diseño de fondo (zonas suaves) · encima: lados, tablas, tabiques y tubos con medidas"
          : `${showDoors ? "" : "Puertas ocultas · "}Los ${formatCm(outerWidthCm)}×${formatCm(outerHeightCm)} cm son exterior; beige = interior útil. Gris = tabiques (${formatCm(cabin.sidePanelCm)} esp.). Línea punteada = tamaño original si mediste menos`}
      </text>
    </svg>
  );
}