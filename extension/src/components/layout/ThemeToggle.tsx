import { useEffect, useRef, useState } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const Icon = theme === "system" ? Laptop : theme === "dark" ? Moon : Sun;

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const options = [
    { value: "system", label: "Sistema", icon: Laptop },
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
  ] as const;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "1px solid var(--ext-border)",
          background: "var(--ext-bg-surface)",
          color: "var(--ext-text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title={`Tema: ${theme}`}
        aria-label="Cambiar tema"
      >
        <Icon style={{ width: 14, height: 14 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            width: 120,
            borderRadius: 10,
            background: "var(--ext-bg-surface)",
            border: "1px solid var(--ext-border)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
            overflow: "hidden",
            zIndex: 80,
          }}
        >
          {options.map((option) => {
            const OptionIcon = option.icon;
            const selected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom:
                    option.value === "dark"
                      ? "none"
                      : "1px solid var(--ext-border-soft)",
                  background: "transparent",
                  color: "var(--ext-text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "7px 9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <OptionIcon style={{ width: 13, height: 13 }} />
                  {option.label}
                </span>
                {selected && (
                  <Check style={{ width: 13, height: 13, color: "#16A34A" }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
