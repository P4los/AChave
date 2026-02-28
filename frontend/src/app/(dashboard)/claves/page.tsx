"use client";

import { useState, useEffect } from "react";
import { Search, Copy, Eye, ExternalLink, ShieldCheck, TriangleAlert, Loader2, Plus, EyeOff, Lock, X, Save, Shuffle } from "lucide-react";
import { useCrypto } from "@/context/CryptoContext";
import { usePasswordGenerator } from "@/hooks/usePasswordGenerator";

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

// Función de derivación y validación local para re-desbloquear el cofre
const derivationAndValidation = async (masterKey: string, encryptedValidator: string, encryptedPrivateKey: string, token: string) => {
  const saltBytes = new TextEncoder().encode(token.substring(0, 16)); 
  
  const importedMasterKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    importedMasterKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const decryptAES = async (b64Ciphertext: string): Promise<string> => {
    try {
      const combinedPayload = new Uint8Array(Buffer.from(b64Ciphertext, 'base64'));
      const iv = combinedPayload.slice(0, 12);
      const ciphertext = combinedPayload.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        ciphertext
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      throw new Error("Clave AES inválida o datos corruptos");
    }
  };

  const validador = await decryptAES(encryptedValidator);
  if (validador !== "SESAMO_ABIERTO") {
    throw new Error("Operación fallida.");
  }

  const privateKeyPem = await decryptAES(encryptedPrivateKey);
  return privateKeyPem;
};


export default function MisClavesPage() {
  const { keys, setKeys, isUnlocked, selectedVault } = useCrypto(); 

  const [loadingContent, setLoadingContent] = useState(false);
  const [passwords, setPasswords] = useState<any[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: string }>({});

  const [showModal, setShowModal] = useState(false);
  const [newWeb, setNewWeb] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { generatePassword } = usePasswordGenerator();

  // Estados para el Desbloqueo Local
  const [lockedEmail, setLockedEmail] = useState("");
  const [lockedCryptoData, setLockedCryptoData] = useState<any>(null);
  const [masterKeyInput, setMasterKeyInput] = useState("");
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const getAuthToken = () => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    return cookies.find(c => c.trim().startsWith('ACHAVE_ACCESS_TOKEN='))?.split('=')[1];
  };

  // 1. Obtiene las claves del servidor si el usuario no tiene llave privada en memoria
  useEffect(() => {
    if (!isUnlocked) {
      const token = getAuthToken();
      if (!token) {
        window.location.href = "/login";
        return;
      }
      
      fetch("http://127.0.0.1:8000/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Token expirado");
        return res.json();
      })
      .then(data => {
        setLockedEmail(data.email);
        setLockedCryptoData(data);
      })
      .catch(() => {
        window.location.href = "/login";
      });
    }
  }, [isUnlocked]);

  // 2. Trae las contraseñas reales cuando ya estemos desbloqueados y con cofre
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
      setPasswords(Array.isArray(pData) ? pData : []);
      setVisiblePasswords({}); // clear visible ones
    } catch (err) {
      console.error(err);
      setPasswords([]);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");
    setIsUnlocking(true);
    
    try {
      const token = getAuthToken();
      if (!token || !lockedCryptoData) throw new Error("No hay token o datos");
      
      // Decrypt the private key locally inside the browser using AES-GCM
      const privateKey = await derivationAndValidation(
        masterKeyInput, 
        lockedCryptoData.validador_cifrado, 
        lockedCryptoData.llave_privada_cifrada,
        token
      );
      
      // Setup CryptoContext which will instantly render the vault
      setKeys({ pub: lockedCryptoData.llave_publica, priv: privateKey });
      
    } catch (err: any) {
      setUnlockError(err.message === "Operación fallida." ? "Master Password incorrecta" : "Error al desbloquear.");
    } finally {
      setIsUnlocking(false);
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
      fetchPasswords();
    } catch (err) {
      alert("Error encriptando y guardando.");
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
        alert("Corrupción al descifrar esta contraseña.");
      }
    }
  };

  // Si la burbuja global no se ha llenado (ej: si recarga la página F5)
  if (!isUnlocked) {
     return (
        <div className="flex flex-col h-[80vh] items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 mt-20 md:p-10 shadow-2xl shadow-slate-200/50 max-w-[480px] w-full flex flex-col relative">
            <div className="flex flex-col items-center text-center mb-8 relative z-10">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Cofre Bloqueado</h2>
              <p className="text-slate-500 text-[15px] font-medium leading-relaxed">
                Por tu seguridad, la Master Password se borra de la memoria al recargar la página. Vuelve a introducirla para descifrar tu cofre.
              </p>
            </div>
            
            <form onSubmit={handleUnlock} className="flex flex-col gap-5 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">Usuario Activo</label>
                <input 
                  type="email" 
                  readOnly
                  value={lockedEmail || "Cargando usuario..."}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none placeholder:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-slate-900">Master Password</label>
                <div className="relative w-full">
                  <input 
                    type={showMasterKey ? "text" : "password"}
                    required
                    value={masterKeyInput}
                    onChange={(e) => setMasterKeyInput(e.target.value)}
                    placeholder="Tu contraseña secreta"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowMasterKey(!showMasterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showMasterKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {unlockError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-2">
                  <TriangleAlert className="w-5 h-5 shrink-0" />
                  <p>{unlockError}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isUnlocking || !lockedEmail}
                className={`mt-2 w-full text-white font-bold py-4 px-6 rounded-[14px] transition-all shadow-sm flex justify-center items-center gap-2 ${
                  isUnlocking || !lockedEmail ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                }`}
              >
                {isUnlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                {isUnlocking ? "Descifrando claves..." : "Desbloquear Cofre"}
              </button>
            </form>
            
            <button 
              onClick={() => {
                document.cookie = 'ACHAVE_ACCESS_TOKEN=; path=/; max-age=0;';
                window.location.href = '/login';
              }} 
              className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors text-center relative z-10"
            >
              Cerrar sesión y cambiar de cuenta
            </button>
          </div>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900">Mis Claves</h1>
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1">
             <ShieldCheck className="w-3 h-3" /> ZK-Protegidas
          </span>
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
                  <span className="text-base font-bold text-slate-900 leading-tight">{item.web}</span>
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
                  onClick={() => {
                    const passToCopy = visiblePasswords[item.passwords_id];
                    if(passToCopy) navigator.clipboard.writeText(passToCopy).then(() => alert("Copiada!"));
                    else alert("Hazla visible antes de copiar (En produccion se desencriptaría en 2do plano)");
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
                <button className="text-slate-400 hover:text-slate-900 transition-colors p-1.5">
                  <ExternalLink className="h-5 w-5" />
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
                <input type="url" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://ejemplo.com" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium" />
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
                <p className="text-[11px] text-green-600 font-bold mt-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Se encriptará localmente antes de enviarse.</p>
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
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-[14px] transition-colors flex items-center justify-center gap-2">
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
