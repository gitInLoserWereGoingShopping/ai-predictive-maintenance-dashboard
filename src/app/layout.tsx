import type { Metadata } from "next";
import "./globals.css";
import "../styles/components.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Maintenance Predictor Dashboard",
  description:
    "Predictive maintenance platform for monitoring industrial assets and preventing failures through ML-powered risk assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
