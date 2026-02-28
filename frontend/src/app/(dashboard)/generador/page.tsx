'use client'

import { Shuffle, Check, Plus, Minus, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { usePasswordGenerator } from "@/hooks/usePasswordGenerator";

export default function GeneradorPage() {
  const { 
    password, 
    generatePassword, 
    length, setLength,
    uppercase, setUppercase,
    lowercase, setLowercase,
    numbers, setNumbers,
    symbols, setSymbols,
    strength
  } = usePasswordGenerator();

  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    generatePassword();
  };

  const handleCopy = () => {
    if (password && password !== "SELECCIONA_AL_MENOS_UNO") {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Toggle = ({ active, onChange }: { active: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${active ? 'bg-green-600 justify-end' : 'bg-slate-300 justify-start'}`}
    >
      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
    </div>
  );

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
            <div className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${strength.color}`}>
              {strength.label}
            </div>
          </div>
          
          <div className={`text-[32px] md:text-[40px] font-mono tracking-wider break-all z-10 leading-tight ${password === "SELECCIONA_AL_MENOS_UNO" ? "text-red-400 text-2xl" : "text-green-400"}`}>
            {password === "SELECCIONA_AL_MENOS_UNO" ? "Selecciona opciones" : password}
          </div>
          
          <div className="mt-8 flex gap-3 z-10">
            <button 
              onClick={handleCopy}
              className={`flex-1 font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? '¡Copiada!' : 'Copiar al Portapapeles'}</span>
            </button>
            <button 
              onClick={handleGenerate}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-3.5 rounded-xl transition-colors flex items-center justify-center"
            >
              <Shuffle className="w-5 h-5" />
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
                <button 
                  onClick={() => setLength(Math.max(4, length - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[18px] font-bold text-slate-900 w-8 text-center">{length}</span>
                <button 
                  onClick={() => setLength(Math.min(64, length + 1))}
                  className="w-8 h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Mayúsculas (A-Z)</span>
              <Toggle active={uppercase} onChange={() => setUppercase(!uppercase)} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Minúsculas (a-z)</span>
              <Toggle active={lowercase} onChange={() => setLowercase(!lowercase)} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-900">Números (0-9)</span>
              <Toggle active={numbers} onChange={() => setNumbers(!numbers)} />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-[15px] font-semibold text-slate-900">Símbolos (!@#$)</span>
              <Toggle active={symbols} onChange={() => setSymbols(!symbols)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
