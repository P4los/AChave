import { useState, useEffect } from "react";
import {
  Search,
  Copy,
  Eye,
  ShieldCheck,
  TriangleAlert,
  Loader2,
  Plus,
  EyeOff,
  X,
  Save,
  Shuffle,
  ExternalLink,
  LogIn,
} from "lucide-react";
import { useCrypto } from "@/context/CryptoContext";
import { usePasswordGenerator } from "@/hooks/usePasswordGenerator";
import { usePwnedPassword } from "@/hooks/usePwnedPassword";
import { usePwnedPasswordBatch } from "@/hooks/usePwnedPasswordBatch";
import { getVaultPasswords, createPassword } from "@/lib/api";
import { toast } from "react-hot-toast";

const encryptFormPassword = async (plain: string, pub: string) => {
  const forge = await import("node-forge");
  return forge.util.encode64(
    forge.pki.publicKeyFromPem(pub).encrypt(plain, "RSA-OAEP"),
  );
};
const decryptVaultPassword = async (enc: string, priv: string) => {
  const forge = await import("node-forge");
  return forge.pki
    .privateKeyFromPem(priv)
    .decrypt(forge.util.decode64(enc), "RSA-OAEP");
};

/** Turn "Netflix" or "netflix.com" into a proper URL */
function toUrl(web: string): string {
  let url = web.trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (!/\./.test(url)) {
    // Just a name like "Netflix" — try google search as fallback
    return `https://www.google.com/search?q=${encodeURIComponent(url + " login")}`;
  }
  return `https://${url}`;
}

const s = {
  card: {
    background: "var(--ext-bg-surface)",
    border: "1px solid var(--ext-border-soft)",
    borderRadius: 12,
    padding: "10px 12px",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 8,
  } as React.CSSProperties,
  input: {
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
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--ext-text-primary)",
    fontFamily: "Inter, sans-serif",
  } as React.CSSProperties,
  btnPrimary: {
    background: "#16A34A",
    color: "white",
    border: "none",
    fontWeight: 700,
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 4,
  } as React.CSSProperties,
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    color: "var(--ext-text-muted)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as React.CSSProperties,
};

export default function ClavesPage() {
  const { keys, isUnlocked, selectedVault } = useCrypto();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState<Record<string, string>>({});
  const [vulns, setVulns] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState(false);
  const [newWeb, setNewWeb] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const { isCheckingVuln, isVulnerable } = usePwnedPassword(newPass);
  const { checkBatchVulnerabilities } = usePwnedPasswordBatch();
  const { generatePassword } = usePasswordGenerator();

  useEffect(() => {
    if (isUnlocked && selectedVault) fetchData();
  }, [isUnlocked, selectedVault]);
  useEffect(() => {
    if (!search.trim()) setFiltered(passwords);
    else {
      const q = search.toLowerCase();
      setFiltered(
        passwords.filter(
          (p) =>
            p.web.toLowerCase().includes(q) ||
            p.user_email.toLowerCase().includes(q),
        ),
      );
    }
  }, [search, passwords]);

  const fetchData = async () => {
    if (!selectedVault) return;
    setLoading(true);
    try {
      const items = await getVaultPasswords(selectedVault.vault_id);
      setPasswords(Array.isArray(items) ? items : []);
      setVisible({});
      setVulns({});
      if (keys?.priv && items.length > 0) {
        const plains: { id: string; plainText: string }[] = [];
        for (const i of items) {
          try {
            plains.push({
              id: String(i.passwords_id),
              plainText: await decryptVaultPassword(i.password, keys.priv),
            });
          } catch {}
        }
        if (plains.length)
          checkBatchVulnerabilities(plains).then((v) => setVulns(v));
      }
    } catch {
      setPasswords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keys || !selectedVault) return;
    try {
      await createPassword({
        web: newWeb,
        user_email: newEmail,
        password: await encryptFormPassword(newPass, keys.pub),
        vault_id: selectedVault.vault_id,
      });
      setModal(false);
      setNewWeb("");
      setNewEmail("");
      setNewPass("");
      toast.success("Guardada");
      fetchData();
    } catch {
      toast.error("Error");
    }
  };

  const toggle = async (id: string, cipher: string) => {
    if (visible[id]) {
      const v = { ...visible };
      delete v[id];
      setVisible(v);
    } else if (keys)
      try {
        setVisible({
          ...visible,
          [id]: await decryptVaultPassword(cipher, keys.priv),
        });
      } catch {
        toast.error("Error");
      }
  };

  const copy = async (id: string, cipher: string) => {
    const p =
      visible[id] ||
      (keys ? await decryptVaultPassword(cipher, keys.priv) : null);
    if (p) {
      await navigator.clipboard.writeText(p);
      toast.success("¡Copiada!");
    }
  };

  /** Open the website in a new tab */
  const goToSite = (web: string) => {
    const url = toUrl(web);
    chrome.tabs.create({ url });
  };

  /** Auto-fill credentials on the active tab */
  const autoFill = async (userEmail: string, cipher: string) => {
    if (!keys) return;
    try {
      const plain =
        visible[cipher] || (await decryptVaultPassword(cipher, keys.priv));

      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        toast.error("No hay pestaña activa.");
        return;
      }

      // Send message to the content script
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: "ACHAVE_AUTOFILL",
          payload: { email: userEmail, password: plain },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Content script might not be loaded — try injecting it first
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id! },
                files: ["content.js"],
              })
              .then(() => {
                // Retry after injection
                setTimeout(() => {
                  chrome.tabs.sendMessage(
                    tab.id!,
                    {
                      type: "ACHAVE_AUTOFILL",
                      payload: { email: userEmail, password: plain },
                    },
                    (retryResponse) => {
                      if (retryResponse?.success) {
                        toast.success(retryResponse.message);
                      } else {
                        toast.error("No se encontraron campos de login.");
                      }
                    },
                  );
                }, 200);
              })
              .catch(() => {
                toast.error("No se puede inyectar en esta página.");
              });
            return;
          }

          if (response?.success) {
            toast.success(response.message);
            // Close the popup after a moment
            setTimeout(() => window.close(), 800);
          } else {
            toast.error(response?.message || "No se encontraron campos.");
          }
        },
      );
    } catch (err) {
      toast.error("Error al autocompletar.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--ext-text-primary)",
            margin: 0,
          }}
        >
          Mis Claves
        </h1>
        <button
          onClick={() => setModal(true)}
          style={{
            ...s.btnPrimary,
            background: "var(--ext-bg-contrast)",
            padding: "6px 12px",
            fontSize: 11,
          }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Nueva
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 14,
            height: 14,
            color: "var(--ext-text-muted)",
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          style={{ ...s.input, paddingLeft: 32 }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2
            style={{
              width: 20,
              height: 20,
              color: "var(--ext-text-muted)",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((item) => (
            <div key={item.passwords_id}>
              <div style={s.card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {/* Site icon */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "var(--ext-bg-soft-2)",
                      border: "1px solid var(--ext-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 9,
                        color: "var(--ext-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.web.substring(0, 2)}
                    </span>
                  </div>
                  {/* Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--ext-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.web}
                      </span>
                      {vulns[item.passwords_id] === true && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            background: "#FEE2E2",
                            color: "#DC2626",
                            padding: "1px 4px",
                            borderRadius: 4,
                            fontSize: 7,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          <TriangleAlert style={{ width: 7, height: 7 }} /> Vuln
                        </span>
                      )}
                      {vulns[item.passwords_id] === false && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            background: "#DCFCE7",
                            color: "#15803D",
                            padding: "1px 4px",
                            borderRadius: 4,
                            fontSize: 7,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          <ShieldCheck style={{ width: 7, height: 7 }} />{" "}
                          Contraseña segura
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--ext-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {item.user_email}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                  {/* Auto-fill */}
                  <button
                    onClick={() => autoFill(item.user_email, item.password)}
                    title="Autocompletar en pestaña activa"
                    style={{ ...s.iconBtn, color: "#16A34A" }}
                  >
                    <LogIn style={{ width: 14, height: 14 }} />
                  </button>
                  {/* Go to site */}
                  <button
                    onClick={() => goToSite(item.web)}
                    title="Ir al sitio web"
                    style={s.iconBtn}
                  >
                    <ExternalLink style={{ width: 14, height: 14 }} />
                  </button>
                  {/* Copy */}
                  <button
                    onClick={() => copy(item.passwords_id, item.password)}
                    title="Copiar contraseña"
                    style={s.iconBtn}
                  >
                    <Copy style={{ width: 14, height: 14 }} />
                  </button>
                  {/* Show/Hide */}
                  <button
                    onClick={() => toggle(item.passwords_id, item.password)}
                    title="Ver contraseña"
                    style={{
                      ...s.iconBtn,
                      color: visible[item.passwords_id]
                        ? "#EF4444"
                        : "var(--ext-text-muted)",
                    }}
                  >
                    {visible[item.passwords_id] ? (
                      <EyeOff style={{ width: 14, height: 14 }} />
                    ) : (
                      <Eye style={{ width: 14, height: 14 }} />
                    )}
                  </button>
                </div>
              </div>
              {visible[item.passwords_id] && (
                <div
                  style={{
                    background: "var(--ext-bg-soft)",
                    border: "1px solid var(--ext-border)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    marginTop: 2,
                    marginLeft: 36,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: "var(--ext-text-secondary)",
                      wordBreak: "break-all",
                    }}
                  >
                    {visible[item.passwords_id]}
                  </span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "var(--ext-text-muted)",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {search ? "Sin resultados." : "No hay claves aún."}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
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
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--ext-text-primary)",
                  margin: 0,
                }}
              >
                Nueva Clave
              </h3>
              <button
                onClick={() => setModal(false)}
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
            <form
              onSubmit={handleAdd}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={s.label}>Sitio Web (URL o nombre)</label>
                <input
                  required
                  value={newWeb}
                  onChange={(e) => setNewWeb(e.target.value)}
                  placeholder="netflix.com, GitHub..."
                  style={s.input}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={s.label}>Usuario / Email</label>
                <input
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="yo@gmail.com"
                  style={s.input}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label style={s.label}>Contraseña</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewPass(
                        generatePassword({
                          length: 16,
                          uppercase: true,
                          lowercase: true,
                          numbers: true,
                          symbols: true,
                        }),
                      )
                    }
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#16A34A",
                      background: "#F0FDF4",
                      border: "none",
                      borderRadius: 6,
                      padding: "2px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <Shuffle style={{ width: 10, height: 10 }} /> Generar
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    required
                    type={showNew ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Contraseña"
                    style={{
                      ...s.input,
                      paddingRight: 36,
                      fontFamily: "monospace",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--ext-text-muted)",
                      padding: 2,
                    }}
                  >
                    {showNew ? (
                      <EyeOff style={{ width: 14, height: 14 }} />
                    ) : (
                      <Eye style={{ width: 14, height: 14 }} />
                    )}
                  </button>
                </div>
                {isCheckingVuln && (
                  <span
                    style={{ fontSize: 10, fontWeight: 600, color: "#3B82F6" }}
                  >
                    Comprobando...
                  </span>
                )}
                {!isCheckingVuln && isVulnerable === true && (
                  <span
                    style={{ fontSize: 10, fontWeight: 600, color: "#DC2626" }}
                  >
                    ⚠ Vulnerable
                  </span>
                )}
                {!isCheckingVuln &&
                  isVulnerable === false &&
                  newPass.length >= 8 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#16A34A",
                      }}
                    >
                      ✓ Segura
                    </span>
                  )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  paddingTop: 8,
                  borderTop: "1px solid var(--ext-border-soft)",
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  style={{
                    flex: 1,
                    background: "var(--ext-bg-surface)",
                    border: "1.5px solid var(--ext-border)",
                    color: "var(--ext-text-primary)",
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
                  type="submit"
                  disabled={
                    isCheckingVuln ||
                    isVulnerable === true ||
                    newPass.length < 8
                  }
                  style={{
                    ...s.btnPrimary,
                    flex: 1,
                    opacity:
                      isCheckingVuln ||
                      isVulnerable === true ||
                      newPass.length < 8
                        ? 0.5
                        : 1,
                  }}
                >
                  Guardar <Save style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
