import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MainLayout } from "@/components/layouts/main-layout";

export const metadata: Metadata = {
  title: "SalesAI - Enterprise SaaS Architecture",
  description: "Production-ready enterprise SaaS boilerplate powered by Next.js 15, FastAPI, and Clean Architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
