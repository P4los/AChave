"use client";

import { useState } from "react";
import { ArrowLeft, Save, Shuffle, Eye, EyeOff, ShieldCheck, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePasswordGenerator } from "@/hooks/usePasswordGenerator";
import { usePwnedPassword } from "@/hooks/usePwnedPassword";

export default function NuevaClavePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const { isCheckingVuln, isVulnerable } = usePwnedPassword(password);

  const { generatePassword } = usePasswordGenerator();

  const handleGeneratePassword = () => {
    const pwd = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
    setPassword(pwd);
  };

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full pb-10">
      
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900">Nueva Clave</h1>
      </div>

      <div className="bg-white rounded-[24px] p-6 md:p-8 flex flex-col gap-8 shadow-sm border border-slate-200/50">
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-900">Sitio Web / Título</label>
            <input 
              type="text" 
              placeholder="Ej. Mi cuenta bancaria, Netflix, Figma..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-900">URL o Enlace</label>
            <input 
              type="text" 
              placeholder="https://ejemplo.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-900">Nombre de Usuario / Correo</label>
            <input 
              type="text" 
              placeholder="Ej. tucorreo@gmail.com o tuusuario"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-[14px] font-bold text-slate-900">Contraseña secreta</label>
              <button type="button" onClick={handleGeneratePassword} className="text-[12px] font-bold flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors bg-green-50 px-2 py-1 rounded-md">
                <Shuffle className="w-3 h-3" /> Generar
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña súper segura"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium font-mono"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isCheckingVuln ? (
                <p className="text-xs font-semibold text-blue-500 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Comprobando en filtraciones seguras...
                </p>
              ) : isVulnerable === true ? (
                <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                  <TriangleAlert className="w-3 h-3" /> Contraseña vulnerable. Genera otra mejor.
                </p>
              ) : isVulnerable === false && password.length >= 8 ? (
                <p className="text-[11px] text-green-600 font-bold flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3"/> Contraseña segura y robusta.
                </p>
              ) : password.length > 0 && password.length < 8 ? (
                <p className="text-[11px] text-orange-600 font-bold flex items-center gap-1 mt-1">
                  <TriangleAlert className="w-3 h-3" /> Mínimo 8 caracteres requeridos.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-900">Notas (Opcional)</label>
            <textarea 
              placeholder="PIN de tarjeta de crédito, código de recuperación..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-4 mt-2">
          <Link
            href="/claves"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold py-3.5 px-6 rounded-[14px] transition-colors flex items-center justify-center"
          >
            Cancelar
          </Link>
          <button 
            type="button"
            disabled={isCheckingVuln || isVulnerable === true || password.length < 8}
            className={`font-bold py-3.5 px-8 rounded-[14px] transition-colors flex items-center justify-center gap-2 ${
              isCheckingVuln || isVulnerable === true || password.length < 8 ? "bg-green-600/50 text-white cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            Guardar Clave
            <Save className="hidden md:block w-4 h-4 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
}
