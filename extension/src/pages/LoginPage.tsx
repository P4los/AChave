import { useState } from "react";
import { ShieldCheck, Lock, TriangleAlert, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "@/context/CryptoContext";
import { loginApi, getMe, setAuthToken, register, getApiBase, setApiBase } from "@/lib/api";

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const derivationAndValidation = async (masterKey: string, encryptedValidator: string, encryptedPrivateKey: string, token: string) => {
  const forge = await import('node-forge');
  const saltBytes = new TextEncoder().encode(token.substring(0, 16));
  const importedMasterKey = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(masterKey), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const aesKey = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" }, importedMasterKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);

  const decryptAES = async (b64: string) => {
    const payload = base64ToUint8Array(b64);
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, aesKey, payload.slice(12));
    return new TextDecoder().decode(decrypted);
  };

  const validador = await decryptAES(encryptedValidator);
  if (validador !== "SESAMO_ABIERTO") throw new Error("Operación fallida.");
  return await decryptAES(encryptedPrivateKey);
};

const generateCryptoPackage = async (masterKey: string, salt: string) => {
  const forge = await import('node-forge');
  const rsaKeypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const publicKeyPem = forge.pki.publicKeyToPem(rsaKeypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(rsaKeypair.privateKey);

  const saltBytes = new TextEncoder().encode(salt.substring(0, 16));
  const importedMasterKey = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(masterKey), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const aesKey = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" }, importedMasterKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);

  const encryptAES = async (plain: string): Promise<string> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(plain));
    const combined = new Uint8Array(iv.length + enc.byteLength);
    combined.set(iv, 0); combined.set(new Uint8Array(enc), iv.length);
    return btoa(String.fromCharCode(...combined));
  };

  return {
    publicKeyPem, privateKeyPem,
    validador_cifrado: await encryptAES("SESAMO_ABIERTO"),
    llave_publica: publicKeyPem,
    llave_privada_cifrada: await encryptAES(privateKeyPem),
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

  const navigate = useNavigate();
  const { setKeys, fetchVaults } = useCrypto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isLogin) {
        const data = await loginApi(email, masterKey);
        await setAuthToken(data.access_token);
        const meData = await getMe(data.access_token);
        if (meData.validador_cifrado && meData.llave_privada_cifrada) {
          const privateKey = await derivationAndValidation(masterKey, meData.validador_cifrado, meData.llave_privada_cifrada, data.access_token);
          await setKeys({ pub: meData.llave_publica!, priv: privateKey });
          await fetchVaults();
        }
        setSuccessMsg("¡Sesión iniciada!");
        setTimeout(() => navigate("/claves"), 800);
      } else {
        // ── REGISTRO Self-Hosted (un solo paso) ──
        if (masterKey.length < 8) throw new Error("La Master Password debe tener al menos 8 caracteres.");

        // 1. Salt temporal para primer cifrado
        const tempSalt = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => String.fromCharCode(65 + (b % 26))).join('');
        const tempCrypto = await generateCryptoPackage(masterKey, tempSalt);

        // 2. Registro completo en un paso
        const data = await register({
          email, password: masterKey,
          validador_cifrado: tempCrypto.validador_cifrado,
          llave_publica: tempCrypto.llave_publica,
          llave_privada_cifrada: tempCrypto.llave_privada_cifrada,
        });

        // 3. Re-cifrar con el JWT real como salt
        const realCrypto = await generateCryptoPackage(masterKey, data.access_token);

        // 4. Actualizar el paquete criptográfico en el servidor
        const apiBase = await getApiBase();
        await fetch(`${apiBase}/auth/setup-crypto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.access_token}` },
          body: JSON.stringify({
            password: masterKey,
            validador_cifrado: realCrypto.validador_cifrado,
            llave_publica: realCrypto.llave_publica,
            llave_privada_cifrada: realCrypto.llave_privada_cifrada,
          })
        });

        // 5. Guardar llaves en memoria y navegar
        await setKeys({ pub: realCrypto.publicKeyPem, priv: realCrypto.privateKeyPem });
        await fetchVaults();
        setSuccessMsg("¡Cuenta creada! Entrando a tu cofre...");
        setTimeout(() => navigate("/claves"), 800);
      }
    } catch (err: any) {
      setError(err.message === "Operación fallida." ? "Master Password incorrecta" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: 390, minHeight: 580, display: 'flex', flexDirection: 'column', background: '#0F172A' }}>
      {/* Compact header */}
      <div style={{ padding: '24px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'white', fontFamily: 'Inter, sans-serif' }}>AChave</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          Gestor de contraseñas con cifrado Zero-Knowledge
        </p>
      </div>

      {/* Form panel */}
      <div style={{
        flex: 1, background: 'white', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20,
        fontFamily: 'Inter, sans-serif'
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </h2>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#64748B', margin: 0 }}>
            {isLogin ? "Accede a tu cofre seguro." : "Elige email y Master Password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Correo Electrónico</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                color: '#0F172A', fontSize: 14, borderRadius: 12,
                padding: '10px 14px', outline: 'none', fontFamily: 'Inter, sans-serif',
                fontWeight: 500, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password — siempre visible (login y registro) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Master Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? "text" : "password"}
                required value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder={isLogin ? "Tu contraseña secreta" : "Mín. 8 caracteres"}
                style={{
                  width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                  color: '#0F172A', fontSize: 14, borderRadius: 12,
                  padding: '10px 40px 10px 14px', outline: 'none', fontFamily: 'Inter, sans-serif',
                  fontWeight: 500, boxSizing: 'border-box',
                }}
              />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94A3B8',
                }}
              >
                {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
            {!isLogin && (
              <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>
                No la olvides — no podemos recuperarla.
              </span>
            )}
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 4, width: '100%', color: 'white', fontWeight: 700,
              padding: '12px 20px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontFamily: 'Inter, sans-serif',
              background: loading ? 'rgba(22, 163, 74, 0.5)' : '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxSizing: 'border-box',
            }}
          >
            {loading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
            {loading ? "Cargando..." : (isLogin ? "Desbloquear cofre" : "Crear mi cofre seguro")}
          </button>

          {error && (
            <div style={{
              padding: 10, background: '#FEF2F2', color: '#DC2626', borderRadius: 10,
              fontSize: 12, fontWeight: 600, border: '1px solid #FEE2E2',
              display: 'flex', alignItems: 'flex-start', gap: 6
            }}>
              <TriangleAlert style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: 10, background: '#F0FDF4', color: '#15803D', borderRadius: 10,
              fontSize: 12, fontWeight: 600, border: '1px solid #DCFCE7',
              display: 'flex', alignItems: 'flex-start', gap: 6
            }}>
              <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Features mini */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 0', borderTop: '1px solid #F1F5F9',
        }}>
          {[
            { icon: Lock, label: 'Zero Knowledge', color: '#22C55E' },
            { icon: ShieldCheck, label: 'Cifrado E2E', color: '#3B82F6' },
            { icon: KeyRound, label: 'RSA-OAEP', color: '#8B5CF6' },
          ].map(f => (
            <div key={f.label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 10, background: '#F8FAFC',
            }}>
              <f.icon style={{ width: 14, height: 14, color: f.color }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center' }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Switch */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4,
          fontSize: 13, paddingTop: 4,
        }}>
          <span style={{ color: '#64748B', fontWeight: 500 }}>
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes un cofre?"}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setSuccessMsg(""); }}
            disabled={loading}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 700, color: '#16A34A', fontSize: 13, fontFamily: 'Inter, sans-serif',
              padding: 0,
            }}
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
