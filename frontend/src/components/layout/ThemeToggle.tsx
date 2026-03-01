"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isSystem = theme === "system";
  const Icon = isSystem ? Laptop : theme === "dark" ? Moon : Sun;

  const labelMap = {
    system: "Sistema",
    dark: "Oscuro",
    light: "Claro",
  } as const;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const options = [
    { value: "system", label: "Sistema", icon: Laptop },
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
  ] as const;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        title={`Tema: ${labelMap[theme]}`}
        aria-label={`Tema actual: ${labelMap[theme]}. Abrir selector de tema`}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors flex items-center justify-center"
      >
        <Icon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-lg z-50 overflow-hidden">
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <OptionIcon className="w-4 h-4" />
                  {option.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-green-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
