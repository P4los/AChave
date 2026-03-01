import { useState, useRef, useEffect } from "react";
import { ShieldCheck, ChevronDown, Check, Plus, Trash2 } from "lucide-react";
import { useCrypto, Vault } from "@/context/CryptoContext";
import { VAULT_ICONS } from "../modals/CreateVaultModal";
import { DeleteVaultModal } from "../modals/DeleteVaultModal";
import ThemeToggle from "./ThemeToggle";

const getIconComponent = (iconName: string | null) => {
  if (!iconName) return ShieldCheck;
  const found = VAULT_ICONS.find((v) => v.name === iconName);
  return found ? found.icon : ShieldCheck;
};

export default function ExtensionHeader({
  onOpenVaultModal,
}: {
  onOpenVaultModal: () => void;
}) {
  const { vaults, selectedVault, setSelectedVault } = useCrypto();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Vault | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const Icon = getIconComponent(selectedVault?.icon || "shield");

  // Calculate dropdown position when opening
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  return (
    <>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "var(--ext-bg-surface)",
          padding: "8px 14px",
          borderBottom: "1px solid var(--ext-border)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          fontFamily: "Inter, sans-serif",
          flexShrink: 0,
        }}
      >
        {/* Vault selector button */}
        <button
          ref={btnRef}
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            maxWidth: "70%",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: selectedVault?.color || "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: 14, height: 14, color: "white" }} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--ext-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedVault?.name || "AChave"}
          </span>
          <ChevronDown
            style={{
              width: 14,
              height: 14,
              color: "var(--ext-text-muted)",
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck style={{ width: 12, height: 12, color: "white" }} />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "var(--ext-text-primary)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            AChave
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Dropdown rendered OUTSIDE the header (same stacking context as overlay) */}
      {open && (
        <>
          {/* Click-away overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "transparent",
            }}
          />

          {/* Dropdown menu */}
          <div
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: 220,
              background: "var(--ext-bg-surface)",
              border: "1px solid var(--ext-border)",
              borderRadius: 14,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              overflow: "hidden",
              zIndex: 60,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {vaults.map((v) => {
                const VI = getIconComponent(v.icon);
                const sel = selectedVault?.vault_id === v.vault_id;
                return (
                  <div
                    key={v.vault_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--ext-border-soft)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedVault(v);
                        setOpen(false);
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: v.color || "#16A34A",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <VI
                            style={{ width: 12, height: 12, color: "white" }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: sel ? 700 : 600,
                            color: sel
                              ? "var(--ext-text-primary)"
                              : "var(--ext-text-secondary)",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {v.name}
                        </span>
                      </div>
                      {sel && (
                        <Check
                          style={{ width: 14, height: 14, color: "#16A34A" }}
                        />
                      )}
                    </button>

                    {!v.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDel(v);
                          setOpen(false);
                        }}
                        style={{
                          padding: 8,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--ext-text-muted)",
                        }}
                      >
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                padding: 6,
                borderTop: "1px solid var(--ext-border-soft)",
                background: "var(--ext-bg-soft)",
              }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenVaultModal();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "var(--ext-bg-surface)",
                  border: "1px solid var(--ext-border)",
                  color: "var(--ext-text-secondary)",
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <Plus style={{ width: 12, height: 12 }} /> Nuevo Cofre
              </button>
            </div>
          </div>
        </>
      )}

      {del && <DeleteVaultModal vault={del} onClose={() => setDel(null)} />}
    </>
  );
}
