"use client";

import { useState } from "react";
import { ShieldCheck, Lock, TriangleAlert, Shuffle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCrypto } from "@/context/CryptoContext";

const derivationAndValidation = async (masterKey: string, encryptedValidator: string, encryptedPrivateKey: string, token: string) => {
  const forge = await import('node-forge');
  const saltBytes = new TextEncoder().encode(token.substring(0, 16)); 
  
  const importedMasterKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    importedMasterKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const decryptAES = async (b64Ciphertext: string): Promise<string> => {
    try {
      const combinedPayload = new Uint8Array(Buffer.from(b64Ciphertext, 'base64'));
      const iv = combinedPayload.slice(0, 12);
      const ciphertext = combinedPayload.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        ciphertext
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      throw new Error("Clave AES inválida o datos corruptos");
    }
  };

  const validador = await decryptAES(encryptedValidator);
  if (validador !== "SESAMO_ABIERTO") {
    throw new Error("Operación fallida.");
  }

  const privateKeyPem = await decryptAES(encryptedPrivateKey);
  return privateKeyPem;
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const router = useRouter();
  const { setKeys, fetchVaults } = useCrypto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const endpoint = isLogin ? "http://127.0.0.1:8000/auth/login" : "http://127.0.0.1:8000/auth/register";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: masterKey // Utilizado para la autenticación en servidor (Fase 1)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || (isLogin ? "Error al iniciar sesión" : "Error al crear la cuenta"));
      }

      if (isLogin) {
        // 1. Guardar el JWT como Cooke para que el Middleware se entere
        document.cookie = `ACHAVE_ACCESS_TOKEN=${data.access_token}; path=/; max-age=86400; SameSite=Strict;`;
        
        // 2. Extraer información encriptada del servidor para el ZK-Crypto
        const meRes = await fetch("http://127.0.0.1:8000/auth/me", {
          headers: { "Authorization": `Bearer ${data.access_token}` }
        });
        const meData = await meRes.json();

        if (meData.validador_cifrado && meData.llave_privada_cifrada) {
           // 3. Desencriptar localmente AHORA en segundo plano antes de cambiar de página
           const privateKey = await derivationAndValidation(
             masterKey, 
             meData.validador_cifrado, 
             meData.llave_privada_cifrada,
             data.access_token
           );
           
           // 4. Guardar en MEMORIA GLOBAL (Contexto)
           setKeys({ pub: meData.llave_publica, priv: privateKey });
           
           // 5. Instigar la recarga de los cofres para que la UI se entere instantáneamente
           await fetchVaults();
        }
        
        setSuccessMsg("¡Sesión iniciada correctamente! Cargando tu cofre...");
        
        // 6. Usar router.push permite mantener vivo el Global Context state
        setTimeout(() => router.push("/claves"), 1000);
      } else {
        console.log("Registro exitoso:", data);
        setSuccessMsg("¡Cuenta creada! Revisa tu bandeja de entrada para verificar tu email.");
        setEmail("");
        setMasterKey("");
      }
    } catch (err: any) {
      setError(err.message === "Operación fallida." ? "Master Password incorrecta localmente" : err.message);
    } finally {
      setLoading(false);
    }
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

          <div className="flex flex-col gap-6 mb-10">
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
                <span className="text-sm text-slate-400">Cifrado de grado militar para proteger todo tu cofre digital.</span>
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

            {isLogin && (
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">Master Password</label>
                <div className="relative w-full">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required={isLogin}
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
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`mt-4 w-full text-white font-bold py-4 px-6 rounded-[14px] transition-all shadow-sm ${
                loading ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
              }`}
            >
              {loading ? "Cargando..." : (isLogin ? "Iniciar sesión" : "Crear mi cofre seguro")}
            </button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-2">
                <TriangleAlert className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {successMsg && (
              <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-semibold border border-green-100 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}
          </form>

          <div className="pt-6 border-t border-slate-100 flex justify-center text-[15px]">
            <span className="text-slate-500 font-medium mr-2">
              {isLogin ? "¿No tienes cuenta todavía?" : "¿Ya tienes un cofre?"}
            </span>
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccessMsg("");
              }}
              disabled={loading}
              className="font-bold text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
            >
              {isLogin ? "Regístrate aquí" : "Inicia sesión"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
