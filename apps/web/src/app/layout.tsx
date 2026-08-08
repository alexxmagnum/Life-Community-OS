import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { MediaLightboxProvider } from "@life-community-os/ui";

import { TenantProvider } from "@/providers/TenantProvider";
import { ExperienceParticipationProvider } from "@/providers/ExperienceParticipationProvider";
import { CommunityInteractionProvider } from "@/providers/CommunityInteractionProvider";
import { ReservationProvider } from "@/providers/ReservationProvider";

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

export const metadata: Metadata = {
  title: {
    default: "Life Panoramica",
    template: "%s · Life Panoramica",
  },
  description: "Tu comunidad, viva.",
  applicationName: "Life Panoramica",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <TenantProvider>
          <ExperienceParticipationProvider>
            <CommunityInteractionProvider>
              <ReservationProvider>
                <MediaLightboxProvider>{children}</MediaLightboxProvider>
              </ReservationProvider>
            </CommunityInteractionProvider>
          </ExperienceParticipationProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
