"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirige al dashboard `/claves` en cuanto cargue la app temporalmente
    router.push("/claves");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-green-600 animate-spin" />
    </div>
  );
}
