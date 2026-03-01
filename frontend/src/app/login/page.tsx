"use client";

import { useState } from "react";
import { ShieldCheck, Lock, TriangleAlert, Shuffle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCrypto } from "@/context/CryptoContext";
import { API_BASE } from "@/lib/api";

// ── Derivación y validación ZK (idéntica al login original) ──
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

// ── Generación del paquete criptográfico ZK (tomado de verify/page.tsx) ──
const generateCryptoPackage = async (masterKey: string, authToken: string) => {
  const forge = await import('node-forge');

  // 1. Generar Par de Llaves RSA (2048-bit)
  const rsaKeypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const publicKeyPem = forge.pki.publicKeyToPem(rsaKeypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(rsaKeypair.privateKey);

  // 2. Derivar llave AES de 256 bits desde la Master Password usando PBKDF2
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
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      new TextEncoder().encode(plainTextToEncrypt)
    );

    const combinedPayload = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combinedPayload.set(iv, 0);
    combinedPayload.set(new Uint8Array(encryptedBuffer), iv.length);

    return Buffer.from(combinedPayload).toString('base64');
  };

  // 3. Cifrar la Llave Privada RSA con AES (Master Password)
  const encryptedPrivateKey = await encryptAES(privateKeyPem);

  // 4. Generar Validador: Ciframos "SESAMO_ABIERTO" con AES (Master Password)
  const validadorCifrado = await encryptAES("SESAMO_ABIERTO");

  return {
    publicKeyPem,
    privateKeyPem,
    validador_cifrado: validadorCifrado,
    llave_publica: publicKeyPem,
    llave_privada_cifrada: encryptedPrivateKey,
  };
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
      if (isLogin) {
        // ── LOGIN ──
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: masterKey }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Error al iniciar sesión");

        // 1. Guardar JWT como Cookie
        document.cookie = `ACHAVE_ACCESS_TOKEN=${data.access_token}; path=/; max-age=86400; SameSite=Strict;`;

        // 2. Obtener datos criptográficos
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { "Authorization": `Bearer ${data.access_token}` }
        });
        const meData = await meRes.json();

        if (meData.validador_cifrado && meData.llave_privada_cifrada) {
          // 3. Desencriptar localmente
          const privateKey = await derivationAndValidation(
            masterKey,
            meData.validador_cifrado,
            meData.llave_privada_cifrada,
            data.access_token
          );

          // 4. Guardar en memoria global
          setKeys({ pub: meData.llave_publica, priv: privateKey });
          await fetchVaults();
        }

        setSuccessMsg("¡Sesión iniciada correctamente! Cargando tu cofre...");
        setTimeout(() => router.push("/claves"), 1000);

      } else {
        // ── REGISTRO (Self-Hosted: todo en un paso) ──
        if (masterKey.length < 8) {
          throw new Error("La Master Password debe tener al menos 8 caracteres.");
        }

        // 1. Necesitamos un salt temporal para derivar la clave AES.
        //    Usamos un placeholder que será reemplazado por el JWT real del servidor.
        //    Pero como el registro ahora devuelve JWT, generamos primero con un salt temporal
        //    y luego el backend guarda todo directamente.

        // Generamos un salt temporal (16 chars) para la derivación inicial
        const tempSalt = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => String.fromCharCode(65 + (b % 26))).join('');

        // 2. Generar paquete criptográfico completo
        const crypto = await generateCryptoPackage(masterKey, tempSalt);

        // 3. Enviar registro completo al backend
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: masterKey,
            validador_cifrado: crypto.validador_cifrado,
            llave_publica: crypto.llave_publica,
            llave_privada_cifrada: crypto.llave_privada_cifrada,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Error al crear la cuenta");

        // 4. Guardar JWT como Cookie  
        document.cookie = `ACHAVE_ACCESS_TOKEN=${data.access_token}; path=/; max-age=86400; SameSite=Strict;`;

        // 5. Ahora re-ciframos con el JWT real como salt (para que el login futuro funcione)
        const realCrypto = await generateCryptoPackage(masterKey, data.access_token);

        // 6. Actualizar el paquete criptográfico en el servidor con el salt correcto (JWT)
        const updateRes = await fetch(`${API_BASE}/auth/setup-crypto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.access_token}`
          },
          body: JSON.stringify({
            password: masterKey,
            validador_cifrado: realCrypto.validador_cifrado,
            llave_publica: realCrypto.llave_publica,
            llave_privada_cifrada: realCrypto.llave_privada_cifrada,
          }),
        });

        if (!updateRes.ok) {
          const errData = await updateRes.json();
          throw new Error(errData.detail || "Error al configurar la criptografía.");
        }

        // 7. Guardar llaves en memoria
        setKeys({ pub: realCrypto.publicKeyPem, priv: realCrypto.privateKeyPem });
        await fetchVaults();

        setSuccessMsg("¡Cuenta creada con éxito! Entrando a tu cofre...");
        setTimeout(() => router.push("/claves"), 1000);
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
                <span className="font-bold text-[16px] text-white">Self-Hosted</span>
                <span className="text-sm text-slate-400">Tus datos siempre en tu propio servidor. Control total.</span>
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
                : "Elige un correo y una Master Password fuerte para proteger tu cofre."}
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
              <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                {!isLogin && <KeyRound className="w-4 h-4 text-slate-500" />}
                Master Password
              </label>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder={isLogin ? "Tu contraseña secreta" : "Tu contraseña secreta (> 8 caracteres)"}
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
              disabled={loading}
              className={`mt-4 w-full text-white font-bold py-4 px-6 rounded-[14px] transition-all shadow-sm ${loading ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? "Descifrando cofre..." : "Generando llaves seguras..."}
                </span>
              ) : (
                isLogin ? "Iniciar sesión" : "Crear mi cofre seguro"
              )}
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
