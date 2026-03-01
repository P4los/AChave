import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CryptoProvider } from "@/context/CryptoContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AChave",
  description: "Tu gestor de contraseñas seguro y sin fricción",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const storedTheme = localStorage.getItem('achave-theme') || 'system';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldUseDark = storedTheme === 'dark' || (storedTheme === 'system' && prefersDark);
                document.documentElement.classList.toggle('dark', shouldUseDark);
                document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light';
              } catch {}
            })();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased text-slate-900 bg-slate-100 min-h-screen dark:text-slate-100 dark:bg-slate-950`}
      >
        <Toaster position="top-right" />
        <ThemeProvider>
          <CryptoProvider>{children}</CryptoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
