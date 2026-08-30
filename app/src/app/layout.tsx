import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Onde Relaxar — Encontre profissionais de massagem perto de você",
    template: "%s | Onde Relaxar",
  },
  description:
    "Diretório de profissionais de massagem no Brasil. Descubra massoterapeutas por cidade, bairro e tipo de massagem, e agende com confiança.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://exemplo-onderelaxar.vercel.app"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Onde Relaxar",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
