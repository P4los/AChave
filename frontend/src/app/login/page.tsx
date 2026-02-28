"use client";

import { useState } from "react";
import { ShieldCheck, Lock, TriangleAlert, Shuffle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isLogin ? "Iniciando sesión con:" : "Registrando:", { email, masterKey });
    // Aquí irían las llamadas a la API o autenticación
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 w-full overflow-hidden">
      {/* Left panel (Dark side) */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 bg-slate-900 text-white min-h-[50vh] md:min-h-screen relative overflow-hidden">
        <div className="flex items-center gap-3 z-10 relative">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <span className="text-[32px] font-extrabold text-white">AChave</span>
        </div>

        <div className="flex flex-col gap-10 mt-16 md:mt-0 z-10 relative">
          <h1 className="text-[32px] md:text-[48px] font-extrabold leading-tight text-white max-w-[400px]">
            Tus contraseñas,<br className="hidden md:block" /> seguras y siempre a mano.
          </h1>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[16px] text-white">Master Password única</span>
                <span className="text-sm text-slate-400">Sólo necesitas recordar una clave maestra. Nosotros hacemos el resto.</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <TriangleAlert className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[16px] text-white">Zero Knowledge</span>
                <span className="text-sm text-slate-400">Ni siquiera nosotros podemos acceder a tus datos o contraseña maestra.</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Shuffle className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[16px] text-white">Generador fortificado</span>
                <span className="text-sm text-slate-400">Cifrado de grado militar para proteger toda tu bóveda digital.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none -mr-[200px] -mt-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none -ml-[100px] -mb-[100px]"></div>
      </div>

      {/* Right panel (White side) */}
      <div className="w-full md:w-[500px] lg:w-[600px] shrink-0 bg-white flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 rounded-t-[32px] md:rounded-l-[32px] md:rounded-tr-none min-h-[50vh] md:min-h-screen relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] -mt-8 md:mt-0">
        <div className="w-full max-w-[400px] flex flex-col gap-10">
          
          <div className="flex flex-col gap-3">
            <h2 className="text-[28px] font-extrabold text-slate-900">
              {isLogin ? "¡Hola de nuevo!" : "Crea tu cuenta"}
            </h2>
            <p className="text-[15px] font-semibold text-slate-500">
              {isLogin 
                ? "Introduce tu correo y tu Master Password para acceder a tu cofre." 
                : "Regístrate gratis y empieza a gestionar tus contraseñas de forma 100% segura."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-bold text-slate-900">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-bold text-slate-900">Master Password</label>
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Tu contraseña secreta"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Asegúrate de no olvidarla. Nosotros <span className="text-red-500 font-bold">no podemos recuperarla</span> por ti.
                </p>
              )}
            </div>

            <button 
              type="submit"
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-[14px] transition-colors shadow-sm shadow-green-600/20"
            >
              {isLogin ? "Iniciar sesión con mi cofre" : "Crear mi cofre seguro"}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 flex justify-center text-[15px]">
            <span className="text-slate-500 font-medium mr-2">
              {isLogin ? "¿No tienes cuenta todavía?" : "¿Ya tienes un cofre?"}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-green-600 hover:text-green-700 transition-colors"
            >
              {isLogin ? "Regístrate aquí" : "Inicia sesión"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
