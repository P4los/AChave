import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  KeyRound,
  TriangleAlert,
  Shuffle,
  Settings,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCrypto, Vault } from "@/context/CryptoContext";
import { VAULT_ICONS } from "../modals/CreateVaultModal";
import { DeleteVaultModal } from "../modals/DeleteVaultModal";
import { Trash2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const sidebarLinks = [
  { href: "/claves", icon: KeyRound, label: "Mis Claves" },
  { href: "/generador", icon: Shuffle, label: "Generador" },
  { href: "/ajustes", icon: Settings, label: "Ajustes" },
];

// Helper to find the actual icon component
const getIconComponent = (iconName: string | null) => {
  if (!iconName) return ShieldCheck;
  const found = VAULT_ICONS.find((v) => v.name === iconName);
  return found ? found.icon : ShieldCheck;
};

export function Sidebar({
  onOpenVaultModal,
}: {
  onOpenVaultModal: () => void;
}) {
  const pathname = usePathname();
  const { vaults, selectedVault, setSelectedVault } = useCrypto();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [vaultToDelete, setVaultToDelete] = useState<Vault | null>(null);
  const [email, setEmail] = useState("Cargando...");
  const [initials, setInitials] = useState("..");

  useEffect(() => {
    // Intentar recuperar del endpoint /auth/me usando el token de las cookies
    const getAuthToken = () => {
      const cookies = document.cookie.split(";");
      return cookies
        .find((c) => c.trim().startsWith("ACHAVE_ACCESS_TOKEN="))
        ?.split("=")[1];
    };

    const token = getAuthToken();
    if (token) {
      fetch("http://127.0.0.1:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.email) {
            setEmail(data.email);
            setInitials(data.email.substring(0, 2).toUpperCase());
          }
        })
        .catch(() => {});
    }
  }, []);

  const CurrentVaultIcon = getIconComponent(selectedVault?.icon || "shield");

  return (
    <div className="hidden md:flex w-[300px] flex-col justify-between h-screen bg-white border-r border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-7 py-10 fixed left-0 top-0">
      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100">
              AChave
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-8 relative">
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-1 flex items-center justify-between">
            Tus Cofres
            <button
              onClick={onOpenVaultModal}
              className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              Nuevo Cofre
            </button>
          </div>

          {/* Selected Vault Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 rounded-[14px] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: selectedVault?.color || "#16A34A" }}
              >
                <CurrentVaultIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                  {selectedVault ? selectedVault.name : "Cargando..."}
                </span>
                <span className="text-[12px] font-semibold text-slate-500">
                  Cofre Activo
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Vault selector dropdown */}
          {isDropdownOpen && vaults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-[14px] shadow-xl overflow-hidden z-20">
              <div className="max-h-[250px] overflow-y-auto">
                {vaults.map((vault) => {
                  const VaultIcon = getIconComponent(vault.icon);
                  const isSelected = selectedVault?.vault_id === vault.vault_id;

                  return (
                    <div
                      key={vault.vault_id}
                      className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 group"
                    >
                      <button
                        onClick={() => {
                          setSelectedVault(vault);
                          setIsDropdownOpen(false);
                        }}
                        className="flex-1 flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{
                              backgroundColor: vault.color || "#16A34A",
                            }}
                          >
                            <VaultIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-sm font-bold ${isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}
                          >
                            {vault.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </button>

                      {!vault.is_default && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVaultToDelete(vault);
                          }}
                          className="p-3 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Link
          href="/claves/nueva"
          className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-[14px] w-full mb-8 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[15px] font-bold">Nueva Clave</span>
        </Link>

        <nav className="flex flex-col gap-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 p-4 rounded-[14px] transition-colors relative ${
                  isActive
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? "text-green-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-[15px] font-bold ${isActive ? "text-green-700 dark:text-green-300" : "text-slate-600 dark:text-slate-300"}`}
                >
                  {link.label}
                </span>

                {link.alert && (
                  <div className="absolute right-4 w-2 h-2 rounded-full bg-red-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 px-1 mt-auto">
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {email.split("@")[0]}
          </span>
        </div>
      </div>

      {/* Overlay to close dropdown if touching outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
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
