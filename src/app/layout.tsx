import type { Metadata } from "next";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "EcoMarket PUCP | Intercambia. Reutiliza. Impacta.",
    template: "%s | EcoMarket PUCP",
  },
  description: "Trueques y donaciones de materiales entre estudiantes. Sin dinero de por medio.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
