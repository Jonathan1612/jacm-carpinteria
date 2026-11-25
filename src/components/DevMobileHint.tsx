"use client";

import { useEffect, useState } from "react";

type NetworkInfo = {
  available: boolean;
  url?: string | null;
  pathPlano?: string;
  message?: string;
};

export function DevMobileHint() {
  const [info, setInfo] = useState<NetworkInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/dev-network")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  if (!info?.available || !info.url) return null;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(info!.pathPlano ?? info!.url!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="dev-mobile-hint">
      <p>
        <strong>Probar en el celular</strong> (misma red WiFi): abre{" "}
        <a href={info.pathPlano ?? info.url}>{info.pathPlano ?? info.url}</a>
        . No uses <code>localhost</code> en el teléfono.
      </p>
      <p className="muted" style={{ margin: "8px 0 0", fontSize: "0.88rem" }}>
        Si los botones no responden: recarga la página. Tras cambiar la configuración, reinicia{" "}
        <code>npm run dev</code> en la Mac.
      </p>
      <button type="button" className="btn btn-ghost btn-small" onClick={copyUrl}>
        {copied ? "Copiado ✓" : "Copiar enlace del plano"}
      </button>
    </div>
  );
}