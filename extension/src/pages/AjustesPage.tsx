import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCrypto } from "@/context/CryptoContext";
import { getMe } from "@/lib/api";
import { toast } from "react-hot-toast";
import { LogOut, ShieldCheck, Info } from "lucide-react";

export default function AjustesPage() {
  const navigate = useNavigate();
  const { logoutKeys } = useCrypto();
  const [email, setEmail] = useState("...");
  const [initials, setInitials] = useState("..");

  useEffect(() => {
    getMe().then(d => { if (d.email) { setEmail(d.email); setInitials(d.email.substring(0, 2).toUpperCase()); } }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logoutKeys();
    toast.success("Sesión cerrada");
    setTimeout(() => navigate("/login"), 400);
  };

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
        <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500, margin: '0 0 4px' }}>AChave v1.0.0 · Extensión Chrome</p>
        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
          Gestor de contraseñas con cifrado Zero-Knowledge. Tus datos nunca salen de tu dispositivo sin cifrar.
        </p>
      </div>
    </div>
  );
}
