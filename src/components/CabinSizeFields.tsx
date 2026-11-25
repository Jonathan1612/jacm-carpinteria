import { formatCm } from "@/lib/closet-design";
import { cabinDimensionSummary } from "@/lib/closet-design";
import { CmDraftField } from "@/components/CmDraftField";

type CabinDims = ReturnType<typeof cabinDimensionSummary>;

type Props = {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  onDepthChange: (v: number) => void;
  cabin?: CabinDims;
  compact?: boolean;
};

/** Medidas exteriores del mueble (lo que mide el cliente / hueco en pared). */
export function CabinSizeFields({
  widthCm,
  heightCm,
  depthCm,
  onWidthChange,
  onHeightChange,
  onDepthChange,
  cabin,
  compact,
}: Props) {
  return (
    <div className={`plan-cabin-size${compact ? " is-compact" : ""}`}>
      <p className="plan-cabin-size-title">
        <strong>Medidas del mueble</strong> (exterior, con puertas al frente)
      </p>
      <div className="split tri plan-cabin-size-inputs">
        <CmDraftField
          label="Ancho (cm)"
          value={widthCm}
          syncToken={`w:${widthCm}`}
          min={80}
          max={500}
          onCommit={onWidthChange}
        />
        <CmDraftField
          label="Alto (cm)"
          value={heightCm}
          syncToken={`h:${heightCm}`}
          min={60}
          max={320}
          onCommit={onHeightChange}
        />
        <CmDraftField
          label="Fondo (cm)"
          value={depthCm}
          syncToken={`d:${depthCm}`}
          min={30}
          max={120}
          onCommit={onDepthChange}
        />
      </div>
      {cabin ? (
        <p className="muted plan-cabin-size-note">
          Interior útil para armar: ~{formatCm(cabin.innerWidthCm)} an × {formatCm(cabin.innerHeightCm)} al (el dibujo
          usa esta caja). Fondo de piezas: {formatCm(depthCm)} cm.
        </p>
      ) : null}
    </div>
  );
}