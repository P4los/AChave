"use client";

import { useRouter } from "next/navigation";

export default function AjustesPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Borrar la cookie del token JWT
    document.cookie = "ACHAVE_ACCESS_TOKEN=; path=/; max-age=0; SameSite=Strict;";
    // Borrar también el paquete criptográfico local
    localStorage.removeItem("achave_crypto_package");
    // Redirigir a login
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900">Ajustes</h1>

        <div className="bg-white rounded-[14px] p-5 flex flex-col gap-4">
          <h2 className="text-[18px] font-bold text-slate-900">Perfil</h2>
          
          <div className="flex items-center gap-4 px-2 py-1">
            <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <span className="text-[22px] font-extrabold text-white">MG</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] font-bold text-slate-900">Miguel García</span>
              <span className="text-[13px] text-slate-500">miguel@gmail.com</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-5 flex flex-col gap-4">
          <h2 className="text-[18px] font-bold text-slate-900">Seguridad</h2>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-slate-900">Verificación automática</span>
              <span className="text-[12px] text-slate-500">Consulta en HaveIBeenPwned en segundo plano</span>
            </div>
            {/* Toggle activo */}
            <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-slate-900">Bloqueo automático</span>
              <span className="text-[12px] text-slate-500">Exigir PIN maestro al volver tras 5m de inactividad</span>
            </div>
            {/* Toggle inactivo */}
            <div className="w-12 h-6 bg-slate-200 rounded-full flex items-center justify-start px-1 cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
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
