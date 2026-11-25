"use client";

import { useEffect, useState } from "react";

function parseCm(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "" || t === "-" || t === "." || t === ",") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

type Props = {
  label: string;
  value: number;
  syncToken: string;
  onCommit: (n: number) => void;
  onInvalid?: () => void;
  min?: number;
  max?: number;
};

/** Input en cm: puedes borrar y escribir; aplica al soltar foco o Enter. */
export function CmDraftField({ label, value, syncToken, onCommit, onInvalid, min, max }: Props) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (editing) return;
    setText(String(value));
  }, [value, syncToken, editing]);

  function revert() {
    setText(String(value));
  }

  function commit() {
    setEditing(false);
    const n = parseCm(text);
    if (n == null) {
      revert();
      return;
    }
    if (min != null && n < min) {
      onInvalid?.();
      revert();
      return;
    }
    if (max != null && n > max) {
      onInvalid?.();
      revert();
      return;
    }
    const rounded = Math.round(n * 10) / 10;
    if (rounded !== value) onCommit(rounded);
    setText(String(rounded));
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onFocus={() => setEditing(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            revert();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
      />
    </label>
  );
}