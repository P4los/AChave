import { useState } from 'react';
import { ShieldCheck, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { useCrypto, Vault } from '@/context/CryptoContext';
import { VAULT_ICONS } from '../modals/CreateVaultModal';
import { DeleteVaultModal } from '../modals/DeleteVaultModal';

const getIconComponent = (iconName: string | null) => {
  if (!iconName) return ShieldCheck;
  const found = VAULT_ICONS.find(v => v.name === iconName);
  return found ? found.icon : ShieldCheck;
};

export function MobileHeader({ onOpenVaultModal }: { onOpenVaultModal: () => void }) {
  const { vaults, selectedVault, setSelectedVault } = useCrypto();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);

  const CurrentVaultIcon = getIconComponent(selectedVault?.icon || "shield");

  return (
    <div className="md:hidden flex items-center justify-between w-full min-h-16 bg-white px-5 border-b border-slate-200 sticky top-0 z-40">
      
      {/* Selector de Cofre Movil */}
      <div className="relative flex-1 py-3">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 max-w-[200px]"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: selectedVault?.color || '#16A34A' }}
          >
            <CurrentVaultIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-[15px] font-extrabold text-slate-900 truncate">
              {selectedVault ? selectedVault.name : "AChave"}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && vaults.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-[240px] bg-white border border-slate-200 rounded-[16px] shadow-2xl overflow-hidden z-20">
            <div className="max-h-[50vh] overflow-y-auto">
              {vaults.map((vault) => {
                const VaultIcon = getIconComponent(vault.icon);
                const isSelected = selectedVault?.vault_id === vault.vault_id;

                return (
                  <div key={vault.vault_id} className="w-full flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                    <button
                      onClick={() => {
                        setSelectedVault(vault);
                        setIsDropdownOpen(false);
                      }}
                      className="flex-1 flex items-center justify-between p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: vault.color || '#16A34A' }}
                        >
                          <VaultIcon className="w-4 h-4" />
                        </div>
                        <span className={`text-[14px] font-bold truncate ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {vault.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                    </button>

                    {!vault.is_default && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setVaultToDelete(vault);
                          setIsDropdownOpen(false);
                        }}
                        className="p-4 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  onOpenVaultModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nuevo Cofre
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay mobile */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-10 bg-slate-900/10 backdrop-blur-[1px]" 
          onClick={() => setIsDropdownOpen(false)} 
          aria-hidden="true"
        />
      )}

      {vaultToDelete && (
        <DeleteVaultModal 
          vault={vaultToDelete} 
          onClose={() => setVaultToDelete(null)} 
        />
      )}
    </div>
  );
}
