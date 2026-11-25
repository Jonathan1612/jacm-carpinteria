import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Source_Sans_3 } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { PRODUCT_NAME } from "@/lib/brand";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const themeBoot = `
(function(){
  try {
    var t = localStorage.getItem('theme');
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();`;

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sansAlt = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans-alt" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description:
    "Portafolio para carpinteros: trabajos, materiales, WhatsApp y solicitud de visita. Planos solo para el administrador.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${sans.variable} ${sansAlt.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <AppProviders>
          <SiteHeader />
          {children}
          <footer className="footer">
            <div className="wrap footer-inner">
              <p>
                <strong>{PRODUCT_NAME}</strong> · portafolio del taller y contacto para clientes.
              </p>
              <p className="muted">Planos y cotización interna: inicia sesión y abre Administrar → Planos.</p>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
