import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import { MediaLightboxProvider } from "@life-community-os/ui";

import { TenantProvider } from "@/providers/TenantProvider";
import { ExperienceParticipationProvider } from "@/providers/ExperienceParticipationProvider";
import { CommunityInteractionProvider } from "@/providers/CommunityInteractionProvider";
import { ReservationProvider } from "@/providers/ReservationProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";

import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/** Wordmark only — Motans luxury lockup (LIFE / PANORÁMICA). */
const brand = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Life Panoramica",
    template: "%s · Life Panoramica",
  },
  description: "Tu comunidad, viva.",
  applicationName: "Life Panoramica",
  appleWebApp: {
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#001219",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} ${brand.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <TenantProvider>
          <ExperienceParticipationProvider>
            <CommunityInteractionProvider>
              <ReservationProvider>
                <NotificationProvider>
                  <MediaLightboxProvider>{children}</MediaLightboxProvider>
                </NotificationProvider>
              </ReservationProvider>
            </CommunityInteractionProvider>
          </ExperienceParticipationProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
