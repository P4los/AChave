'use client'


import { Shuffle, Check, Plus, Minus, TriangleAlert } from "lucide-react";
import { useState } from "react";

export default function GeneradorPage() {

  const [password, setPassword] = useState("");

  const generatePassword = () => {
    // Generador criptográficamente seguro
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    
    let generated = "";
    for (let i = 0; i < 16; i++) {
      generated += chars[array[i] % chars.length];
    }
    setPassword(generated);
  };

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900 mb-2">Generador</h1>
          <p className="text-sm font-semibold text-slate-500">
            Crea contraseñas seguras y únicas para cada servicio.
          </p>
        </div>

        {/* Display de contraseña */}
        <div className="flex flex-col bg-slate-900 rounded-[16px] p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 z-10">
            <h2 className="text-lg font-bold text-white">Tu nueva contraseña</h2>
            <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold border border-green-500/30">
              Muy Segura
            </div>
          </div>
          
          <div className="text-[32px] md:text-[40px] font-mono tracking-wider text-green-400 break-all z-10 leading-tight">
            {password}
          </div>
          
          <div className="mt-8 flex gap-3 z-10">
            <button className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              <span>Copiar al Portapapeles</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-3.5 rounded-xl transition-colors flex items-center justify-center">
              <Shuffle onClick={generatePassword} className="w-5 h-5" />
            </button>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Opciones */}
        <div className="bg-white rounded-[14px] p-5 flex flex-col gap-5 mt-2 shadow-sm border border-slate-200/50">
          <h2 className="text-[18px] font-bold text-slate-900">Configuración</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Longitud</span>
              
              <div className="flex items-center gap-3">
                <button className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[18px] font-bold text-slate-900 w-8 text-center">15</span>
                <button className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Mayúsculas (A-Z)</span>
              {/* Toggle activo */}
              <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Minúsculas (a-z)</span>
              {/* Toggle activo */}
              <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Números (0-9)</span>
              {/* Toggle activo */}
              <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-[15px] font-semibold text-slate-900">Símbolos (!@#$)</span>
              {/* Toggle activo */}
              <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
