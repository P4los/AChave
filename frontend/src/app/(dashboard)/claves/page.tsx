"use client";

import { useState, useEffect } from "react";
import { Search, Copy, Eye, ExternalLink, ShieldCheck, TriangleAlert, Loader2, Plus, EyeOff, Lock, X, Save, Shuffle } from "lucide-react";
import { useCrypto } from "@/context/CryptoContext";
import { usePasswordGenerator } from "@/hooks/usePasswordGenerator";
import { usePwnedPassword } from "@/hooks/usePwnedPassword";
import { usePwnedPasswordBatch } from "@/hooks/usePwnedPasswordBatch";
import { toast } from "react-hot-toast";

// Funciones criptográficas (RSA para passwords)
const encryptFormPassword = async (plainPassword: string, pubKeyPem: string) => {
    const forge = await import('node-forge');
    const publicKey = forge.pki.publicKeyFromPem(pubKeyPem);
    const encrypted = publicKey.encrypt(plainPassword, 'RSA-OAEP');
    return forge.util.encode64(encrypted);
};

const decryptVaultPassword = async (encryptedB64: string, privKeyPem: string) => {
    const forge = await import('node-forge');
    const privateKey = forge.pki.privateKeyFromPem(privKeyPem);
    const decoded = forge.util.decode64(encryptedB64);
    const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP');
    return decrypted;
};



export default function MisClavesPage() {
  const { keys, setKeys, isUnlocked, selectedVault } = useCrypto(); 

  const [isMounted, setIsMounted] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [passwords, setPasswords] = useState<any[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: string }>({});
  const [vulnerabilities, setVulnerabilities] = useState<{ [key: string]: boolean }>({});

  const [showModal, setShowModal] = useState(false);
  const [newWeb, setNewWeb] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { isCheckingVuln, isVulnerable } = usePwnedPassword(newPass);
  const { isCheckingBatch, checkBatchVulnerabilities } = usePwnedPasswordBatch();

  const { generatePassword } = usePasswordGenerator();



  const getAuthToken = () => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    return cookies.find(c => c.trim().startsWith('ACHAVE_ACCESS_TOKEN='))?.split('=')[1];
  };

  // 1. Efecto inicial de montaje para evitar el flash de SSR ("Cofre Bloqueado" por 1ms)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Redirige a login si el usuario no tiene llaves en memoria
  useEffect(() => {
    if (isMounted && !isUnlocked) {
      window.location.href = "/login";
    }
  }, [isUnlocked, isMounted]);

  // 3. Trae las contraseñas reales cuando ya estemos desbloqueados y con cofre
  useEffect(() => {
    if (isUnlocked && selectedVault) {
      fetchPasswords();
    }
  }, [isUnlocked, selectedVault]);

  const fetchPasswords = async () => {
    if (!selectedVault) return;
    setLoadingContent(true);
    try {
      const token = getAuthToken();
      const pRes = await fetch(`http://127.0.0.1:8000/passwords/vault/${selectedVault.vault_id}`, { 
        headers: {"Authorization": `Bearer ${token}`}
      });
      const pData = await pRes.json();
      const items = Array.isArray(pData) ? pData : [];
      setPasswords(items);
      setVisiblePasswords({});
      setVulnerabilities({});

      // Lote de vulnerabilidades silencioso en 2do plano (requiere la llave privada de JS)
      if (keys?.priv && items.length > 0) {
        // Desencriptamos todo a escondidas sin mostrarlo en UI global
        const plainsForChecking = [];
        for (const item of items) {
          try {
            const plain = await decryptVaultPassword(item.password, keys.priv);
            plainsForChecking.push({ id: item.passwords_id, plainText: plain });
          } catch(e) { /* skip */ }
        }
        
        // Llamar al batch checker solo con los descifrados exitosos
        if (plainsForChecking.length > 0) {
          checkBatchVulnerabilities(plainsForChecking).then(vulns => {
             setVulnerabilities(vulns);
          });
        }
      }

    } catch (err) {
      console.error(err);
      setPasswords([]);
    } finally {
      setLoadingContent(false);
    }
  };


  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keys || !selectedVault) return;

    try {
      // Magia ZK: Encriptar asimétricamente usando Llave Pública
      const encryptedValue = await encryptFormPassword(newPass, keys.pub);

      const payload = {
        web: newWeb,
        user_email: newEmail,
        password: encryptedValue,
        vault_id: selectedVault.vault_id
      };

      const token = getAuthToken();
      await fetch("http://127.0.0.1:8000/passwords/", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setShowModal(false);
      setNewWeb(""); setNewUrl(""); setNewEmail(""); setNewPass(""); setNewNotes("");
      toast.success("Clave guardada con éxito");
      fetchPasswords();
    } catch (err) {
      toast.error("Error encriptando y guardando.");
    }
  };

  const handleGeneratePassword = () => {
    const pwd = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
    setNewPass(pwd);
  };

  const togglePasswordVisibility = async (pwdId: string, cipherText: string) => {
    if (visiblePasswords[pwdId]) {
      const newVis = { ...visiblePasswords };
      delete newVis[pwdId];
      setVisiblePasswords(newVis);
    } else {
      if (!keys) return;
      try {
        // Magia ZK: Desencriptar con Llave Privada en Cliente
        const plain = await decryptVaultPassword(cipherText, keys.priv);
        setVisiblePasswords({ ...visiblePasswords, [pwdId]: plain });
      } catch (err) {
        toast.error("Corrupción al descifrar esta contraseña.");
      }
    }
  };

  if (!isMounted) {
    return <div className="flex flex-col h-[80vh] items-center justify-center p-4"></div>;
  }

  if (!isUnlocked) {
    return <div className="flex flex-col h-[80vh] items-center justify-center p-4"></div>;
  }

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900">Mis Claves</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          <Plus className="w-5 h-5" /> Nueva Clave
        </button>
      </div>

      <div className="w-full relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full bg-white border border-slate-200 text-slate-900 text-[15px] rounded-[14px] pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-slate-400"
          placeholder="Buscar..."
        />
      </div>

      {loadingContent ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {passwords.map((item) => (
            <div
              key={item.passwords_id}
              className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-[14px] border border-transparent transition-all group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                  <span className="font-extrabold text-slate-400 capitalize">{item.web.substring(0,2)}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 leading-tight">{item.web}</span>
                    {vulnerabilities[item.passwords_id] === true ? (
                      <span className="flex items-center gap-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase" title="Esta contraseña apareció en filtraciones públicas">
                        <TriangleAlert className="w-3 h-3" /> Vulnerable
                      </span>
                    ) : vulnerabilities[item.passwords_id] === false ? (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase" title="No se han encontrado filtraciones conocidas">
                        <ShieldCheck className="w-3 h-3" /> Segura
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-500">{item.user_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 md:mt-0">
                <div className="bg-slate-100 px-3 py-1.5 text-center rounded-lg flex-1 md:flex-none">
                    <span className="text-[13px] font-mono font-bold text-slate-700 tracking-wider">
                      {visiblePasswords[item.passwords_id] ? visiblePasswords[item.passwords_id] : "••••••••••••"}
                    </span>
                </div>

                <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

                <button 
                  onClick={async () => {
                    const passToCopy = visiblePasswords[item.passwords_id];
                    if (passToCopy) {
                      navigator.clipboard.writeText(passToCopy).then(() => toast.success("Copiada al portapapeles!"));
                    } else if (keys) {
                      try {
                        // Desencriptamos "al vuelo" en 2do plano sin mostrarlo en UI
                        const plain = await decryptVaultPassword(item.password, keys.priv);
                        navigator.clipboard.writeText(plain).then(() => toast.success("Copiada de forma segura!"));
                      } catch (err) {
                        toast.error("Error al descifrar para copiar.");
                      }
                    }
                  }}
                  className="text-slate-400 hover:text-slate-900 transition-colors p-1.5"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => togglePasswordVisibility(item.passwords_id, item.password)}
                  className="text-slate-400 hover:text-slate-900 transition-colors p-1.5"
                >
                  {visiblePasswords[item.passwords_id] ? <EyeOff className="h-5 w-5 text-red-500"/> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}

          {passwords.length === 0 && (
            <div className="text-center p-10 text-slate-400 font-bold">No hay claves en tu Cofre. Añade la primera.</div>
          )}
        </div>
      )}

      {/* MODAL CREAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] p-6 md:p-8 w-full max-w-[500px] shadow-2xl m-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[24px] font-extrabold text-slate-900">Nueva Clave</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">Sitio Web / Título</label>
                <input required type="text" value={newWeb} onChange={e=>setNewWeb(e.target.value)} placeholder="Ej. Netflix, Figma, GitHub..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">URL o Enlace</label>
                <input type="text" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://ejemplo.com" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">Usuario / Email</label>
                <input required type="text" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="yo@gmail.com o miguelg_dev" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium" />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-[14px] font-bold text-slate-900">Contraseña secreta</label>
                  <button type="button" onClick={handleGeneratePassword} className="text-[12px] font-bold flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors bg-green-50 px-2 py-1 rounded-md">
                    <Shuffle className="w-3 h-3" /> Generar
                  </button>
                </div>
                
                <div className="relative w-full">
                  <input 
                    required 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPass} 
                    onChange={e=>setNewPass(e.target.value)} 
                    placeholder="Tu contraseña secreta" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium font-mono" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {isCheckingVuln ? (
                  <p className="text-xs font-semibold text-blue-500 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Comprobando en filtraciones seguras...
                  </p>
                ) : isVulnerable === true ? (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <TriangleAlert className="w-3 h-3" /> Contraseña vulnerable. Genera otra mejor.
                  </p>
                ) : isVulnerable === false && newPass.length >= 8 ? (
                  <p className="text-[11px] text-green-600 font-bold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3"/> Contraseña segura y robusta.
                  </p>
                ) : newPass.length > 0 && newPass.length < 8 ? (
                  <p className="text-[11px] text-orange-600 font-bold mt-1 flex items-center gap-1">
                    <TriangleAlert className="w-3 h-3" /> Mínimo 8 caracteres requeridos.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">Notas (Opcional)</label>
                <textarea 
                  value={newNotes}
                  onChange={e=>setNewNotes(e.target.value)}
                  placeholder="PIN, código de recuperación..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium resize-none"
                />
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold py-3.5 px-6 rounded-[14px] transition-colors flex items-center justify-center">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isCheckingVuln || isVulnerable === true || newPass.length < 8}
                  className={`font-bold py-3.5 px-6 rounded-[14px] transition-colors flex items-center justify-center gap-2 ${
                    isCheckingVuln || isVulnerable === true || newPass.length < 8 ? "bg-green-600/50 text-white cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  Guardar Clave <Save className="hidden md:block w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
