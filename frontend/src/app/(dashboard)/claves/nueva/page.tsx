"use client";

import { useState } from "react";
import { ArrowLeft, Save, Shuffle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NuevaClavePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const generatePassword = () => {
    // Generador de prueba simple
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
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
              type="url" 
              placeholder="https://ejemplo.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-900">Nombre de Usuario / Correo</label>
            <input 
              type="text" 
              placeholder="Ej. miguel@gmail.com o miguelg_dev"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-slate-900">Contraseña secreta</label>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative w-full flex-1">
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
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-[14px] transition-colors flex items-center justify-center gap-2"
          >
            Guardar Clave
            <Save className="w-4 h-4 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
}
