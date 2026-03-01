"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { API_BASE } from "@/lib/api";

interface CryptoKeys {
  pub: string;
  priv: string;
}

export interface Vault {
  vault_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_default: boolean;
}

interface CryptoContextProps {
  keys: CryptoKeys | null;
  setKeys: (keys: CryptoKeys | null) => void;
  isUnlocked: boolean;
  logoutKeys: () => void;

  vaults: Vault[];
  selectedVault: Vault | null;
  setSelectedVault: (vault: Vault | null) => void;
  fetchVaults: () => Promise<void>;
  deleteVault: (id: string, isCurrentlySelected: boolean) => Promise<boolean>;
}

const CryptoContext = createContext<CryptoContextProps | undefined>(undefined);

export const CryptoProvider = ({ children }: { children: ReactNode }) => {
  // Las llaves viven SOLO en memoria RAM.
  // Al recargar la página se pierden y el usuario debe volver a introducir su Master Password.
  // Esto es intencional para mayor seguridad (la llave privada nunca toca el disco).
  const [keys, setKeys] = useState<CryptoKeys | null>(null);

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  const getAuthToken = () => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    return cookies.find(c => c.trim().startsWith('ACHAVE_ACCESS_TOKEN='))?.split('=')[1];
  };

  const fetchVaults = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/vaults/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVaults(data);
        if (data.length > 0 && !selectedVault) {
          setSelectedVault(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching vaults:", err);
    }
  };

  // Solo traemos vaults cuando estamos en una ruta protegida y tenemos token, 
  // pero lo más seguro es llamarlo explícitamente al loguearnos o montar la app 
  // si el token existe. Para no saturar, lo hacemos en el hook inicial.
  useEffect(() => {
    if (getAuthToken()) {
      fetchVaults();
    }
  }, []);

  const logoutKeys = () => {
    setKeys(null);
    setVaults([]);
    setSelectedVault(null);
  };

  const deleteVault = async (id: string, isCurrentlySelected: boolean) => {
    try {
      const token = getAuthToken();
      if (!token) return false;
      const res = await fetch(`${API_BASE}/vaults/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setVaults(prev => prev.filter(v => v.vault_id !== id));
        if (isCurrentlySelected) {
          // Si eliminamos la actual, cambiar a la por defecto (asumida la primera u otra disponible)
          setVaults(prev => {
            const remaining = prev.filter(v => v.vault_id !== id);
            if (remaining.length > 0) {
              const defaultVault = remaining.find(v => v.is_default) || remaining[0];
              setSelectedVault(defaultVault);
            }
            return remaining;
          });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting vault:", err);
      return false;
    }
  };

  const isUnlocked = keys !== null;

  return (
    <CryptoContext.Provider value={{
      keys, setKeys, isUnlocked, logoutKeys,
      vaults, selectedVault, setSelectedVault, fetchVaults, deleteVault
    }}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) {
    throw new Error("useCrypto debe usarse dentro de un CryptoProvider");
  }
  return context;
};
