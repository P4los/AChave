import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CryptoProvider } from "@/context/CryptoContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AChave",
  description: "Tu gestor de contraseñas seguro y sin fricción",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased text-slate-900 bg-slate-100 min-h-screen`}>
        <CryptoProvider>
          {children}
        </CryptoProvider>
      </body>
    </html>
  );
}
