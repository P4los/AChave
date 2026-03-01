import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { storage } from "../lib/storage";
import { getVaults as fetchVaultsApi, deleteVaultApi, getAuthToken, Vault } from "../lib/api";

export type { Vault };

interface CryptoKeys {
  pub: string;
  priv: string;
}

interface CryptoContextProps {
  keys: CryptoKeys | null;
  setKeys: (keys: CryptoKeys | null) => void;
  isUnlocked: boolean;
  isLoading: boolean;
  logoutKeys: () => void;

  vaults: Vault[];
  selectedVault: Vault | null;
  setSelectedVault: (vault: Vault | null) => void;
  fetchVaults: () => Promise<void>;
  deleteVault: (id: string, isCurrentlySelected: boolean) => Promise<boolean>;
}

const CryptoContext = createContext<CryptoContextProps | undefined>(undefined);

export const CryptoProvider = ({ children }: { children: ReactNode }) => {
  const [keys, _setKeys] = useState<CryptoKeys | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  // Recover keys from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedKeys = await storage.get("achave_keys");
        if (storedKeys) {
          const parsed = JSON.parse(storedKeys);
          if (parsed?.pub && parsed?.priv) {
            _setKeys(parsed);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Fetch vaults when we have keys and a token
  useEffect(() => {
    if (keys) {
      fetchVaults();
    }
  }, [keys]);

  const setKeys = async (newKeys: CryptoKeys | null) => {
    _setKeys(newKeys);
    if (newKeys) {
      await storage.set("achave_keys", JSON.stringify(newKeys));
    } else {
      await storage.remove("achave_keys");
    }
  };

  const fetchVaults = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await fetchVaultsApi();
      setVaults(data);
      if (data.length > 0 && !selectedVault) {
        setSelectedVault(data[0]);
      }
    } catch (err) {
      console.error("Error fetching vaults:", err);
    }
  };

  const logoutKeys = async () => {
    _setKeys(null);
    setVaults([]);
    setSelectedVault(null);
    await storage.remove("achave_keys");
    await storage.remove("achave_token");
  };

  const deleteVault = async (id: string, isCurrentlySelected: boolean) => {
    try {
      await deleteVaultApi(id);
      const remaining = vaults.filter(v => v.vault_id !== id);
      setVaults(remaining);
      if (isCurrentlySelected && remaining.length > 0) {
        const defaultVault = remaining.find(v => v.is_default) || remaining[0];
        setSelectedVault(defaultVault);
      }
      return true;
    } catch (err) {
      console.error("Error deleting vault:", err);
      return false;
    }
  };

  const isUnlocked = keys !== null;

  return (
    <CryptoContext.Provider value={{
      keys, setKeys, isUnlocked, isLoading, logoutKeys,
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
