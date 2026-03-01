import { Check, Plus, Minus, Copy, Shuffle } from "lucide-react";
import { useState } from "react";
import { usePasswordGenerator } from "@/hooks/usePasswordGenerator";

export default function GeneradorPage() {
  const {
    password,
    generatePassword,
    length,
    setLength,
    uppercase,
    setUppercase,
    lowercase,
    setLowercase,
    numbers,
    setNumbers,
    symbols,
    setSymbols,
    strength,
  } = usePasswordGenerator();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (password && password !== "SELECCIONA_AL_MENOS_UNO") {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Toggle = ({
    active,
    onChange,
  }: {
    active: boolean;
    onChange: () => void;
  }) => (
    <div
      onClick={onChange}
      style={{
        width: 36,
        height: 18,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        padding: "0 2px",
        cursor: "pointer",
        transition: "background 0.2s",
        background: active ? "#16A34A" : "var(--ext-border)",
        justifyContent: active ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );

  const strengthColors: Record<string, string> = {
    Inválida: "#F87171",
    Débil: "#F87171",
    Buena: "#FACC15",
    "Muy Segura": "#4ADE80",
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
      <div>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--ext-text-primary)",
            margin: "0 0 2px",
          }}
        >
          Generador
        </h1>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ext-text-secondary)",
            margin: 0,
          }}
        >
          Crea contraseñas seguras y únicas.
        </p>
      </div>

      {/* Password display */}
      <div
        style={{
          background: "var(--ext-bg-contrast)",
          borderRadius: 14,
          padding: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>
            Tu nueva contraseña
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: strengthColors[strength.label] || "#64748B",
              background: "rgba(255,255,255,0.1)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {strength.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 15,
            fontFamily: "monospace",
            letterSpacing: 1,
            wordBreak: "break-all",
            lineHeight: 1.3,
            color:
              password === "SELECCIONA_AL_MENOS_UNO" ? "#F87171" : "#4ADE80",
            minHeight: 22,
          }}
        >
          {password === "SELECCIONA_AL_MENOS_UNO"
            ? "Selecciona opciones"
            : password}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              fontWeight: 700,
              padding: "8px 10px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: copied ? "#22C55E" : "var(--ext-bg-surface)",
              color: copied ? "white" : "var(--ext-text-primary)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {copied ? (
              <Check style={{ width: 14, height: 14 }} />
            ) : (
              <Copy style={{ width: 14, height: 14 }} />
            )}
            {copied ? "¡Copiada!" : "Copiar"}
          </button>
          <button
            onClick={() => generatePassword()}
            style={{
              background: "var(--ext-bg-soft-2)",
              border: "none",
              cursor: "pointer",
              padding: 8,
              borderRadius: 10,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shuffle style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Options */}
      <div
        style={{
          background: "var(--ext-bg-surface)",
          borderRadius: 14,
          padding: 14,
          border: "1px solid var(--ext-border-soft)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ext-text-primary)",
            display: "block",
            marginBottom: 10,
          }}
        >
          Configuración
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 10,
            borderBottom: "1px solid var(--ext-border-soft)",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ext-text-primary)",
            }}
          >
            Longitud
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setLength(Math.max(4, length - 1))}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--ext-bg-soft-2)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ext-text-secondary)",
              }}
            >
              <Minus style={{ width: 10, height: 10 }} />
            </button>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ext-text-primary)",
                width: 24,
                textAlign: "center",
              }}
            >
              {length}
            </span>
            <button
              onClick={() => setLength(Math.min(64, length + 1))}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#DCFCE7",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#15803D",
              }}
            >
              <Plus style={{ width: 10, height: 10 }} />
            </button>
          </div>
        </div>

        {[
          {
            label: "Mayúsculas (A-Z)",
            active: uppercase,
            fn: () => setUppercase(!uppercase),
          },
          {
            label: "Minúsculas (a-z)",
            active: lowercase,
            fn: () => setLowercase(!lowercase),
          },
          {
            label: "Números (0-9)",
            active: numbers,
            fn: () => setNumbers(!numbers),
          },
          {
            label: "Símbolos (!@#$)",
            active: symbols,
            fn: () => setSymbols(!symbols),
          },
        ].map((opt, i, arr) => (
          <div
            key={opt.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom:
                i < arr.length - 1
                  ? "1px solid var(--ext-border-soft)"
                  : "none",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ext-text-primary)",
              }}
            >
              {opt.label}
            </span>
            <Toggle active={opt.active} onChange={opt.fn} />
          </div>
        ))}
      </div>
    </div>
  );
}
