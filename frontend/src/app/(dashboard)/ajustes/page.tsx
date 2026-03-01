"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function AjustesPage() {
  const router = useRouter();
  const [email, setEmail] = useState("Cargando...");
  const [initials, setInitials] = useState("..");

  useEffect(() => {
    // Intentar recuperar del endpoint /auth/me usando el token de las cookies
    const getAuthToken = () => {
      const cookies = document.cookie.split(';');
      return cookies.find(c => c.trim().startsWith('ACHAVE_ACCESS_TOKEN='))?.split('=')[1];
    };

    const token = getAuthToken();
    if (token) {
      fetch("http://127.0.0.1:8000/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setEmail(data.email);
          setInitials(data.email.substring(0, 2).toUpperCase());
        }
      })
      .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    // Borrar la cookie del token JWT
    document.cookie = "ACHAVE_ACCESS_TOKEN=; path=/; max-age=0; SameSite=Strict;";
    toast.success("Has cerrado sesión");
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  };

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900">Ajustes</h1>

        <div className="bg-white rounded-[14px] p-5 flex flex-col gap-4">
          <h2 className="text-[18px] font-bold text-slate-900">Perfil</h2>
          
          <div className="flex items-center gap-4 px-2 py-1">
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <span className="text-[22px] font-extrabold text-white">{initials}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] font-bold text-slate-900">{email.split('@')[0]}</span>
              <span className="text-[13px] text-slate-500">{email}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-5 flex flex-col gap-4 mt-2">
          <h2 className="text-[18px] font-bold text-red-500">Zona Peligro</h2>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-slate-900">Cerrar sesión</span>
              <span className="text-[12px] text-slate-500">Cerrará la sesión en este dispositivo</span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-xl text-[14px] font-bold hover:bg-red-100 transition-colors w-full md:w-auto"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
