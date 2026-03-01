import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCrypto } from "@/context/CryptoContext";
import { getMe, getApiBase, setApiBase } from "@/lib/api";
import { toast } from "react-hot-toast";
import { LogOut, Server, CheckCircle, TriangleAlert } from "lucide-react";

export default function AjustesPage() {
  const navigate = useNavigate();
  const { logoutKeys } = useCrypto();
  const [email, setEmail] = useState("...");
  const [initials, setInitials] = useState("..");

  // ── Servidor ──
  const [serverUrl, setServerUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    getMe().then(d => {
      if (d.email) { setEmail(d.email); setInitials(d.email.substring(0, 2).toUpperCase()); }
    }).catch(() => { });

    // Cargar URL guardada
    getApiBase().then(url => {
      setServerUrl(url);
      setSavedUrl(url);
    });
  }, []);

  const handleLogout = async () => {
    await logoutKeys();
    toast.success("Sesión cerrada");
    setTimeout(() => navigate("/login"), 400);
  };

  const handleTestAndSave = async () => {
    if (!serverUrl.trim()) return;
    setSavingUrl(true);
    setTestStatus("testing");
    try {
      const cleanUrl = serverUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok && res.status !== 200) throw new Error("No responde");
      // Guardar
      await setApiBase(cleanUrl);
      setSavedUrl(cleanUrl);
      setTestStatus("ok");
      toast.success("Servidor configurado correctamente");
      // Reset tras 3s
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch {
      setTestStatus("error");
      toast.error("No se pudo conectar al servidor");
      setTimeout(() => setTestStatus("idle"), 3000);
    } finally {
      setSavingUrl(false);
    }
  };

  const isDirty = serverUrl.trim().replace(/\/$/, '') !== savedUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Ajustes</h1>

      {/* Profile */}
      <div style={{ background: 'white', borderRadius: 14, padding: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 10 }}>Perfil</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email.split('@')[0]}
            </div>
            <div style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
        </div>
      </div>

      {/* Servidor self-hosted */}
      <div style={{ background: 'white', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Server style={{ width: 12, height: 12, color: '#6366F1' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>Servidor</span>
        </div>

        <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 10px', fontWeight: 500, lineHeight: 1.5 }}>
          URL de tu servidor AChave. Cambia esto si tienes el backend en otro ordenador o dominio.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="url"
            value={serverUrl}
            onChange={e => { setServerUrl(e.target.value); setTestStatus("idle"); }}
            placeholder="http://192.168.1.50:8000"
            style={{
              width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0',
              borderRadius: 10, padding: '8px 12px', fontSize: 12, fontFamily: 'Inter, sans-serif',
              fontWeight: 500, color: '#0F172A', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleTestAndSave}
            disabled={savingUrl || !isDirty}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 10, border: 'none',
              fontSize: 12, fontWeight: 700, cursor: (savingUrl || !isDirty) ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: testStatus === 'ok' ? '#F0FDF4' : testStatus === 'error' ? '#FEF2F2' : (savingUrl || !isDirty) ? '#F1F5F9' : '#EEF2FF',
              color: testStatus === 'ok' ? '#15803D' : testStatus === 'error' ? '#DC2626' : (savingUrl || !isDirty) ? '#94A3B8' : '#4F46E5',
            }}
          >
            {testStatus === 'testing' && <span style={{ fontSize: 11 }}>Conectando...</span>}
            {testStatus === 'ok' && <><CheckCircle style={{ width: 12, height: 12 }} /> Guardado</>}
            {testStatus === 'error' && <><TriangleAlert style={{ width: 12, height: 12 }} /> Sin conexión</>}
            {testStatus === 'idle' && (isDirty ? "Probar y guardar" : "URL guardada ✓")}
          </button>
        </div>
      </div>

      {/* Logout */}
      <div style={{ background: 'white', borderRadius: 14, padding: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', display: 'block', marginBottom: 10 }}>Zona Peligro</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Cerrar sesión</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>Borra las llaves locales</div>
          </div>
          <button onClick={handleLogout} style={{
            background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif', flexShrink: 0,
          }}>
            <LogOut style={{ width: 12, height: 12 }} /> Salir
          </button>
        </div>
      </div>

      {/* About */}
      <div style={{ background: 'white', borderRadius: 14, padding: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>Acerca de</span>
        <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500, margin: '0 0 4px' }}>AChave v1.0.0 · Self-Hosted</p>
        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
          Gestor de contraseñas con cifrado Zero-Knowledge. Tus datos nunca salen de tu dispositivo sin cifrar.
        </p>
      </div>
    </div>
  );
}
