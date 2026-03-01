import { useState } from "react";
import {
  X,
  Lock,
  Shield,
  KeyRound,
  Briefcase,
  Building,
  Laptop,
  ShoppingCart,
  Wallet,
  CreditCard,
  Gamepad2,
  Music,
  Film,
  Plane,
  Car,
  Globe,
  Heart,
  HelpCircle,
  Star,
  Smartphone,
  Code,
  Coffee,
  Camera,
  Folder,
  Gift,
  Loader2,
} from "lucide-react";
import { useCrypto } from "@/context/CryptoContext";
import { createVault } from "@/lib/api";
import { toast } from "react-hot-toast";

export const VAULT_ICONS = [
  { name: "lock", icon: Lock },
  { name: "shield", icon: Shield },
  { name: "key-round", icon: KeyRound },
  { name: "briefcase", icon: Briefcase },
  { name: "building", icon: Building },
  { name: "laptop", icon: Laptop },
  { name: "shopping-cart", icon: ShoppingCart },
  { name: "wallet", icon: Wallet },
  { name: "credit-card", icon: CreditCard },
  { name: "gamepad-2", icon: Gamepad2 },
  { name: "music", icon: Music },
  { name: "film", icon: Film },
  { name: "plane", icon: Plane },
  { name: "car", icon: Car },
  { name: "globe", icon: Globe },
  { name: "heart", icon: Heart },
  { name: "help-circle", icon: HelpCircle },
  { name: "star", icon: Star },
  { name: "smartphone", icon: Smartphone },
  { name: "code", icon: Code },
  { name: "coffee", icon: Coffee },
  { name: "camera", icon: Camera },
  { name: "folder", icon: Folder },
  { name: "gift", icon: Gift },
];

export const VAULT_COLORS = [
  "#16A34A",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export function CreateVaultModal({ onClose }: { onClose: () => void }) {
  const { fetchVaults, setSelectedVault } = useCrypto();
  const [icon, setIcon] = useState("lock");
  const [color, setColor] = useState(VAULT_COLORS[0]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const v = await createVault({ name, icon, color });
      await fetchVaults();
      setSelectedVault(v);
      toast.success("Cofre creado");
      onClose();
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        background: "var(--ext-overlay)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--ext-bg-surface)",
          border: "1px solid var(--ext-border-soft)",
          borderRadius: 16,
          padding: 16,
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          maxHeight: "95%",
          overflowY: "auto",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--ext-text-primary)",
              margin: 0,
            }}
          >
            Crear Cofre
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              background: "var(--ext-bg-soft-2)",
              border: "none",
              cursor: "pointer",
              color: "var(--ext-text-secondary)",
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ext-text-primary)",
              }}
            >
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Trabajo, Compras..."
              style={{
                width: "100%",
                background: "var(--ext-bg-soft)",
                border: "1.5px solid var(--ext-border)",
                color: "var(--ext-text-primary)",
                fontSize: 12,
                borderRadius: 10,
                padding: "8px 12px",
                outline: "none",
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ext-text-primary)",
              }}
            >
              Icono
            </label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {VAULT_ICONS.map((item) => {
                const I = item.icon;
                const sel = icon === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setIcon(item.name)}
                    style={{
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: sel ? color : "var(--ext-bg-soft-2)",
                      color: sel ? "white" : "var(--ext-text-secondary)",
                    }}
                  >
                    <I style={{ width: 14, height: 14 }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ext-text-primary)",
              }}
            >
              Color
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              {VAULT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: c,
                    border: color === c ? "3px solid #E2E8F0" : "none",
                    cursor: "pointer",
                    transform: color === c ? "scale(1.15)" : "none",
                    transition: "all 0.15s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              background: "var(--ext-bg-soft-2)",
              color: "var(--ext-text-secondary)",
              border: "none",
              fontWeight: 700,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{
              flex: 1,
              background:
                loading || !name.trim() ? "rgba(22,163,74,0.5)" : "#16A34A",
              color: "white",
              border: "none",
              fontWeight: 700,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {loading ? (
              <Loader2
                style={{
                  width: 14,
                  height: 14,
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <>
                <Lock style={{ width: 12, height: 12 }} /> Crear
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
