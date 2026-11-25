"use client";

import type { ClosetTemplate } from "@/lib/closet-design";
import type { TemplateSection } from "@/lib/closet-design";
import { setSectionDepthCm, setSectionSizeCm } from "@/lib/plan-builder";
import { CmDraftField } from "@/components/CmDraftField";

type Size = { widthCm: number; heightCm: number; depthCm?: number };

type Props = {
  sectionId: string;
  section: TemplateSection;
  sizes: Size;
  template: ClosetTemplate;
  outerWidthCm: number;
  outerHeightCm: number;
  outerDepthCm: number;
  thicknessMm: number;
  onTemplateChange: (next: ClosetTemplate) => void;
  onError: (msg: string) => void;
};

export function PieceSizeFields({
  sectionId,
  section,
  sizes,
  template,
  outerWidthCm,
  outerHeightCm,
  outerDepthCm,
  thicknessMm,
  onTemplateChange,
  onError,
}: Props) {
  const syncToken = `${sectionId}:${sizes.widthCm}:${sizes.heightCm}:${sizes.depthCm ?? ""}`;

  return (
    <div className="plan-builder-piece-size">
      <p className="plan-builder-piece-size-title">
        <strong>Medidas de esta pieza</strong> · {section.label}
      </p>
      <p className="muted plan-builder-piece-size-hint">Enter o toca fuera del cuadro para aplicar.</p>
      <div className="split tri plan-builder-piece-size-inputs">
        <CmDraftField
          label="Ancho (cm)"
          value={sizes.widthCm}
          syncToken={syncToken}
          min={5}
          max={500}
          onInvalid={() => onError("Ancho fuera de rango.")}
          onCommit={(widthCm) => {
            const next = setSectionSizeCm(
              template,
              sectionId,
              { widthCm },
              outerWidthCm,
              outerHeightCm,
              thicknessMm,
            );
            if ("error" in next) onError(next.error);
            else onTemplateChange(next);
          }}
        />
        <CmDraftField
          label="Alto (cm)"
          value={sizes.heightCm}
          syncToken={syncToken}
          min={5}
          max={400}
          onInvalid={() => onError("Alto fuera de rango.")}
          onCommit={(heightCm) => {
            const next = setSectionSizeCm(
              template,
              sectionId,
              { heightCm },
              outerWidthCm,
              outerHeightCm,
              thicknessMm,
            );
            if ("error" in next) onError(next.error);
            else onTemplateChange(next);
          }}
        />
        <CmDraftField
          label="Fondo (cm)"
          value={sizes.depthCm ?? Math.max(outerDepthCm - 2, 20)}
          syncToken={syncToken}
          min={15}
          max={outerDepthCm}
          onInvalid={() => onError("Fondo fuera de rango.")}
          onCommit={(depthCm) => {
            const next = setSectionDepthCm(template, sectionId, depthCm, outerDepthCm);
            if ("error" in next) onError(next.error);
            else onTemplateChange(next);
          }}
        />
      </div>
    </div>
  );
}