import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Boogaloo } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { WhatsAppProvider } from "@/contexts/whatsapp-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { DevModeProvider } from "@/contexts/dev-mode-context";
import ReactQueryProvider from "@/providers/react-query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const boogaloo = Boogaloo({
  variable: "--font-boogaloo",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Lucas FII Alerts - Plataforma de alertas inteligentes para investidores.",
  description: "Receba alertas personalizados de Fundos Imobiliários diretamente no seu Whatsapp. Mantenha-se informado sobre oportunidades e novidades do mercado imobiliário com facilidade e conveniência.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${boogaloo.variable} antialiased`}
      >
        <ReactQueryProvider>
          <DevModeProvider>
            <SidebarProvider>
              <WhatsAppProvider>
                {children}
              </WhatsAppProvider>
            </SidebarProvider>
          </DevModeProvider>
        </ReactQueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
