"use client";

import { useState } from "react";
import {
  X, Lock, Shield, KeyRound, Briefcase, Building,
  Laptop, ShoppingCart, Wallet, CreditCard, Gamepad2,
  Music, Film, Plane, Car, Globe, Heart, HelpCircle,
  Star, Smartphone, Code, Coffee, Camera, Folder, Gift, Loader2
} from "lucide-react";
import { useCrypto } from "@/context/CryptoContext";
import { toast } from "react-hot-toast";
import { API_BASE } from "@/lib/api";

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
  "#16A34A", // green-600
  "#3B82F6", // blue-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
];

interface CreateVaultModalProps {
  onClose: () => void;
}

export function CreateVaultModal({ onClose }: CreateVaultModalProps) {
  const { fetchVaults, setSelectedVault } = useCrypto();

  const [selectedIcon, setSelectedIcon] = useState("lock");
  const [selectedColor, setSelectedColor] = useState(VAULT_COLORS[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    return cookies.find(c => c.trim().startsWith('ACHAVE_ACCESS_TOKEN='))?.split('=')[1];
  };

  const handleCreateVault = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const token = getAuthToken();
      const payload = {
        name,
        description: description || null,
        icon: selectedIcon,
        color: selectedColor
      };

      const res = await fetch(`${API_BASE}/vaults/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Error al crear el cofre");
      }

      const newVault = await res.json();

      // Update the global state
      await fetchVaults();

      // Auto-select the newly created vault
      setSelectedVault(newVault);

      toast.success("Cofre creado con éxito");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al crear el cofre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] p-6 md:p-10 w-full max-w-[540px] flex flex-col gap-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold text-slate-900">Crear Cofre Nuevo</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-semibold text-slate-900">Nombre del Cofre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Trabajo, Compras Online..."
              className="w-full bg-white border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[15px] font-semibold text-slate-900">Icono del Cofre</label>
            <div className="flex gap-2.5 flex-wrap">
              {VAULT_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setSelectedIcon(item.name)}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isSelected
                        ? 'text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    style={isSelected ? {
                      backgroundColor: selectedColor,
                      boxShadow: `0 4px 6px -1px ${selectedColor}40, 0 2px 4px -2px ${selectedColor}40`
                    } : undefined}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-semibold text-slate-900">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del cofre..."
              rows={2}
              className="w-full bg-white border border-slate-200 text-slate-900 text-[15px] rounded-[14px] px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[15px] font-semibold text-slate-900">Color del Cofre</label>
            <div className="flex gap-4">
              {VAULT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${selectedColor === color ? 'scale-110 ring-4 ring-slate-100' : 'hover:scale-105'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 px-4 rounded-[14px] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateVault}
            disabled={loading || !name.trim()}
            className={`flex-1 font-bold py-3.5 px-4 rounded-[14px] transition-colors flex items-center justify-center gap-2 ${loading || !name.trim() ? "bg-green-600/50 text-white cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
              }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Cofre"}
            {!loading && <Lock className="w-4 h-4 ml-1" />}
          </button>
        </div>

      </div>
    </div>
  );
}
