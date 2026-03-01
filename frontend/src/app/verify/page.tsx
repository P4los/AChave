"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, TriangleAlert, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { usePwnedPassword } from "@/hooks/usePwnedPassword";
import { useCrypto } from "@/context/CryptoContext";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setKeys, fetchVaults } = useCrypto();
  
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  
  const [masterKey, setMasterKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");

  const { isCheckingVuln, isVulnerable } = usePwnedPassword(masterKey);

  // 1. Al cargar la página, extraemos el token y verificamos el email automáticamente
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (!urlToken) {
      setVerifyError("Enlace inválido. No se ha encontrado el token de verificación.");
      setIsVerifying(false);
      return;
    }
    
    setToken(urlToken);
    verifyEmailToken(urlToken);
  }, [searchParams]);

  const verifyEmailToken = async (verifyToken: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/auth/verify/${verifyToken}`, {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al verificar el correo.");
      }

      // El backend nos devuelve el JWT para poder configurar la Master Password después
      if (data.access_token) {
        // Guardamos el token en las cookies para que el Middleware y las futuras peticiones funcionen
        document.cookie = `ACHAVE_ACCESS_TOKEN=${data.access_token}; path=/; max-age=86400; SameSite=Strict;`;
        console.log("Email verificado con éxito y sesión iniciada.");
      } else {
        throw new Error("No se recibió token de acceso desde el servidor.");
      }
      
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Formulario para configurar la Master Password
  const handleSubmitMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey.length < 8) {
      setSetupError("La Master Password debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setSetupError("");

    try {
      // MAGIA CRIPTOGRÁFICA EN EL LADO DEL CLIENTE
      // Usaremos Forge para asimétrica (RSA) y Web Crypto nativo para simétrica (AES-GCM) y Hash
      const forge = await import('node-forge');

      // 1. Generar Par de Llaves RSA (2048-bit)
      // Generamos par RSA para cifrar contraseñas asimétricamente entre sesiones futuras
      const rsaKeypair = forge.pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
      const publicKeyPem = forge.pki.publicKeyToPem(rsaKeypair.publicKey);
      const privateKeyPem = forge.pki.privateKeyToPem(rsaKeypair.privateKey);

      // 2. Derivar llave AES de 256 bits desde la Master Password usando PBKDF2
      // La sal (salt) será el JWT token del usuario para hacerlo único pero predecible para él
      // Recuperamos nuestra cookie JWT que nos dio el email link
      const cookies = document.cookie.split(';');
      const authToken = cookies.find(c => c.trim().startsWith('ACHAVE_ACCESS_TOKEN='))?.split('=')[1];
      
      if (!authToken) throw new Error("No hay sesión válida para encriptar.");

      const saltBytes = new TextEncoder().encode(authToken.substring(0, 16)); 
      
      const importedMasterKey = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(masterKey),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBytes,
          iterations: 100000,
          hash: "SHA-256"
        },
        importedMasterKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      // Helper para cifrar un texto plano a Base64 con AES-GCM
      const encryptAES = async (plainTextToEncrypt: string): Promise<string> => {
        // En GCM el IV debe ser único, 12 bytes es el estándar seguro.
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv },
          aesKey,
          new TextEncoder().encode(plainTextToEncrypt)
        );
        
        // Juntamos el IV y el Ciphertext en un solo array (para poder desencriptar luego)
        const combinedPayload = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combinedPayload.set(iv, 0);
        combinedPayload.set(new Uint8Array(encryptedBuffer), iv.length);

        // Convertir a b64 para poder transportarlo por JSON
        return Buffer.from(combinedPayload).toString('base64');
      };

      // 3. Cifrar la Llave Privada RSA con AES (Master Password)
      const encryptedPrivateKey = await encryptAES(privateKeyPem);

      // 4. Generar Validaor: Ciframos la palabra comodín "SESAMO_ABIERTO" con AES (Master Password)
      // Para saber en el futuro si la Master Password desencriptó correctamente el AES.
      const validadorCifrado = await encryptAES("SESAMO_ABIERTO");

      const cryptoPackage = {
        password: masterKey, // Se envía para autenticación
        validador_cifrado: validadorCifrado,
        llave_publica: publicKeyPem,
        llave_privada_cifrada: encryptedPrivateKey
      };

      const response = await fetch("http://127.0.0.1:8000/auth/setup-crypto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}` // Enviamos el JWT para autorizar
        },
        body: JSON.stringify(cryptoPackage),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al configurar la Master Password.");
      }

      //console.log("Cofre configurado con éxito:", data);
      
      
      setKeys({ pub: publicKeyPem, priv: privateKeyPem });
      await fetchVaults();
      
      // ¡Todo listo! Redirigimos al Dashboard (Ya tienen la sesión puesta en la Cookie)
      router.push("/claves");

    } catch (err: any) {
      setSetupError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 w-full overflow-hidden">
      {/* Panel Izquierdo Oscuro */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 bg-slate-900 text-white min-h-[50vh] md:min-h-screen relative overflow-hidden">
        <div className="flex items-center gap-3 z-10 relative">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <span className="text-[32px] font-extrabold text-white">AChave</span>
        </div>

        <div className="flex flex-col gap-10 mt-16 md:mt-0 z-10 relative">
          <h1 className="text-[32px] mb-4 md:text-[48px] font-extrabold leading-tight text-white max-w-[450px]">
            El último paso para tu seguridad absoluta.
          </h1>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none -mr-[200px] -mt-[100px]"></div>
      </div>

      {/* Panel Derecho Blanco */}
      <div className="w-full md:w-[500px] lg:w-[600px] shrink-0 bg-white flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 rounded-t-[32px] md:rounded-l-[32px] md:rounded-tr-none min-h-[50vh] md:min-h-screen relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] -mt-8 md:mt-0">
        
        {isVerifying ? (
          <div className="flex flex-col items-center justify-center gap-4 text-slate-500">
            <Loader2 className="w-12 h-12 animate-spin text-green-500" />
            <h2 className="text-xl font-bold text-slate-900">Verificando tu correo...</h2>
            <p>Por favor, espera unos segundos.</p>
          </div>
        ) : verifyError ? (
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-[400px]">
             <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <TriangleAlert className="w-8 h-8 text-red-600" />
             </div>
             <h2 className="text-[28px] font-extrabold text-slate-900 text-center">Enlace expirado o inválido</h2>
             <p className="text-center text-slate-500 font-medium">{verifyError}</p>
             <button 
               onClick={() => router.push("/login")}
               className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-[14px] transition-colors"
             >
               Volver al Registro
             </button>
          </div>
        ) : (
          <div className="w-full max-w-[400px] flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="text-[28px] font-extrabold text-slate-900">
                Crea tu Master Password
              </h2>
              <p className="text-[15px] font-semibold text-slate-500">
                Has verificado tu correo con éxito. Ahora elige una contraseña maestra única y fuerte para proteger todo tu cofre digital.
              </p>
            </div>

            <form onSubmit={handleSubmitMasterPassword} className="flex flex-col gap-5 w-full">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  Master Password Segura
                </label>
                <div className="relative w-full">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="Tu contraseña secreta (> 8 caracteres)"
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
                {isCheckingVuln ? (
                  <p className="text-xs font-semibold text-blue-500 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Comprobando si es segura...
                  </p>
                ) : isVulnerable === true ? (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <TriangleAlert className="w-3 h-3" /> Contraseña vulnerable. ¡Debes elegir otra!
                  </p>
                ) : isVulnerable === false && masterKey.length >= 8 ? (
                  <p className="text-xs font-semibold text-green-600 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ¡Contraseña segura y robusta!
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Asegúrate de no olvidarla. Nosotros <span className="text-red-500 font-bold">no podemos recuperarla</span> por ti.
                  </p>
                )}
              </div>

              {setupError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-2">
                  <TriangleAlert className="w-5 h-5 shrink-0" />
                  <p>{setupError}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting || masterKey.length < 8 || isCheckingVuln || isVulnerable === true}
                className={`mt-4 w-full text-white font-bold py-4 px-6 rounded-[14px] transition-all shadow-sm ${
                  (isSubmitting || masterKey.length < 8 || isCheckingVuln || isVulnerable === true) ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                }`}
              >
                {isSubmitting ? "Finalizando..." : "Generar llaves y finalizar"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
