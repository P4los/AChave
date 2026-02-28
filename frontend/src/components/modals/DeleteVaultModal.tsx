import { useState } from 'react';
import { X, TriangleAlert, Loader2 } from 'lucide-react';
import { useCrypto, Vault } from '@/context/CryptoContext';

interface DeleteVaultModalProps {
  onClose: () => void;
  vault: Vault;
}

export function DeleteVaultModal({ onClose, vault }: DeleteVaultModalProps) {
  const { deleteVault, selectedVault } = useCrypto();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const isCurrentlySelected = selectedVault?.vault_id === vault.vault_id;
    const success = await deleteVault(vault.vault_id, isCurrentlySelected);
    
    if (success) {
      onClose();
    } else {
      alert("Hubo un error al eliminar el cofre. Verifica que tienes conexión.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[24px] p-6 md:p-8 w-full max-w-[450px] shadow-2xl m-auto border border-red-100">
        
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-50">
            <TriangleAlert className="w-6 h-6 text-red-600" />
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <h3 className="text-[24px] font-extrabold text-slate-900 leading-tight mb-3">
          ¿Eliminar {vault.name}?
        </h3>
        
        <p className="text-[15px] font-semibold text-slate-500 mb-6">
          Esta acción es permanente. Todas las contraseñas almacenadas dentro de este cofre se eliminarán de inmediato y no podrán recuperarse. ¿Estás absolutamente seguro?
        </p>
        
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isDeleting}
            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold py-3.5 px-6 rounded-[14px] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Eliminando...</>
            ) : (
              "Sí, eliminar"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
