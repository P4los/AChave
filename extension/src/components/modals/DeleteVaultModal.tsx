import { useState } from 'react';
import { X, TriangleAlert, Loader2 } from 'lucide-react';
import { useCrypto, Vault } from '@/context/CryptoContext';
import { toast } from 'react-hot-toast';

export function DeleteVaultModal({ onClose, vault }: { onClose: () => void; vault: Vault }) {
  const { deleteVault, selectedVault } = useCrypto();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deleteVault(vault.vault_id, selectedVault?.vault_id === vault.vault_id);
    if (ok) { toast.success("Eliminado"); onClose(); }
    else { toast.error("Error"); setDeleting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 16, width: '100%', maxWidth: 300, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TriangleAlert style={{ width: 16, height: 16, color: '#DC2626' }} />
          </div>
          <button onClick={onClose} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>¿Eliminar {vault.name}?</h3>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#64748B', margin: '0 0 16px' }}>Todas las contraseñas se eliminarán permanentemente.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} disabled={deleting} style={{ flex: 1, background: 'white', border: '1.5px solid #E2E8F0', color: '#0F172A', fontWeight: 700, borderRadius: 10, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: deleting ? 0.5 : 1 }}>Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} style={{
            flex: 1, background: '#DC2626', color: 'white', border: 'none', fontWeight: 700, borderRadius: 10, padding: '8px 12px', fontSize: 12,
            cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            fontFamily: 'Inter, sans-serif', opacity: deleting ? 0.5 : 1,
          }}>
            {deleting ? <><Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> Eliminando</> : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
