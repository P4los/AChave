import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, TriangleAlert, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { usePwnedPassword } from "@/hooks/usePwnedPassword";
import { useCrypto } from "@/context/CryptoContext";
import { verifyEmail, setupCrypto, setAuthToken } from "@/lib/api";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setKeys, fetchVaults } = useCrypto();
  const [authToken, _setAuthToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const { isCheckingVuln, isVulnerable } = usePwnedPassword(masterKey);

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) { setVerifyError("Enlace inválido."); setIsVerifying(false); return; }
    verifyEmail(t).then(d => {
      if (d.access_token) { setAuthToken(d.access_token); _setAuthToken(d.access_token); }
      else throw new Error("No se recibió token.");
    }).catch((e: any) => setVerifyError(e.message)).finally(() => setIsVerifying(false));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey.length < 8) { setSetupError("Mínimo 8 caracteres."); return; }
    setIsSubmitting(true); setSetupError("");
    try {
      const forge = await import('node-forge');
      const kp = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
      const pub = forge.pki.publicKeyToPem(kp.publicKey);
      const priv = forge.pki.privateKeyToPem(kp.privateKey);
      if (!authToken) throw new Error("Sin sesión.");
      const salt = new TextEncoder().encode(authToken.substring(0, 16));
      const mk = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(masterKey), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
      const aes = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, mk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      const enc = async (t: string) => {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const buf = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, new TextEncoder().encode(t));
        const c = new Uint8Array(iv.length + buf.byteLength); c.set(iv, 0); c.set(new Uint8Array(buf), iv.length);
        return uint8ArrayToBase64(c);
      };
      await setupCrypto({ password: masterKey, validador_cifrado: await enc("SESAMO_ABIERTO"), llave_publica: pub, llave_privada_cifrada: await enc(priv) }, authToken);
      await setKeys({ pub, priv }); await fetchVaults(); navigate("/claves");
    } catch (e: any) { setSetupError(e.message); setIsSubmitting(false); }
  };

  return (
    <div style={{ width: 390, minHeight: 580, display: 'flex', flexDirection: 'column', background: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>AChave</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', margin: 0 }}>Último paso para tu seguridad.</p>
      </div>

      <div style={{ flex: 1, background: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {isVerifying ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Loader2 style={{ width: 32, height: 32, color: '#22C55E', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Verificando...</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>Espera unos segundos.</span>
          </div>
        ) : verifyError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TriangleAlert style={{ width: 24, height: 24, color: '#DC2626' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Enlace inválido</span>
            <span style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>{verifyError}</span>
            <button onClick={() => navigate("/login")} style={{ width: '100%', background: '#0F172A', color: 'white', border: 'none', fontWeight: 700, borderRadius: 12, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Volver al Login</button>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Crea tu Master Password</h2>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B', margin: 0 }}>Elige una contraseña maestra fuerte.</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <KeyRound style={{ width: 12, height: 12, color: '#64748B' }} /> Master Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} required value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="Mínimo 8 caracteres"
                    style={{ width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#0F172A', fontSize: 14, borderRadius: 12, padding: '10px 40px 10px 14px', outline: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 500, boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}>
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                {isCheckingVuln && <span style={{ fontSize: 10, fontWeight: 600, color: '#3B82F6' }}>Comprobando...</span>}
                {!isCheckingVuln && isVulnerable === true && <span style={{ fontSize: 10, fontWeight: 600, color: '#DC2626' }}>⚠ ¡Vulnerable!</span>}
                {!isCheckingVuln && isVulnerable === false && masterKey.length >= 8 && <span style={{ fontSize: 10, fontWeight: 600, color: '#16A34A' }}>✓ ¡Segura!</span>}
                {!isCheckingVuln && isVulnerable === null && masterKey.length < 8 && <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>No podemos <span style={{ color: '#EF4444', fontWeight: 700 }}>recuperarla</span>.</span>}
              </div>
              {setupError && (
                <div style={{ padding: 8, background: '#FEF2F2', color: '#DC2626', borderRadius: 8, fontSize: 10, fontWeight: 600, border: '1px solid #FEE2E2', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <TriangleAlert style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} /> <span>{setupError}</span>
                </div>
              )}
              <button type="submit" disabled={isSubmitting || masterKey.length < 8 || isCheckingVuln || isVulnerable === true}
                style={{ width: '100%', color: 'white', fontWeight: 700, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: (isSubmitting || masterKey.length < 8) ? 'not-allowed' : 'pointer', fontSize: 14, background: (isSubmitting || masterKey.length < 8 || isCheckingVuln || isVulnerable === true) ? 'rgba(22,163,74,0.5)' : '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
                {isSubmitting && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
                {isSubmitting ? "Finalizando..." : "Generar llaves y finalizar"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
