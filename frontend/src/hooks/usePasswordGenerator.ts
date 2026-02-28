import { useState, useCallback, useEffect } from 'react';

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function usePasswordGenerator(initialOptions?: Partial<GeneratorOptions>) {
  const [length, setLength] = useState(initialOptions?.length ?? 16);
  const [uppercase, setUppercase] = useState(initialOptions?.uppercase ?? true);
  const [lowercase, setLowercase] = useState(initialOptions?.lowercase ?? true);
  const [numbers, setNumbers] = useState(initialOptions?.numbers ?? true);
  const [symbols, setSymbols] = useState(initialOptions?.symbols ?? true);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const getStrength = (len: number, up: boolean, low: boolean, num: boolean, sym: boolean) => {
    if (!up && !low && !num && !sym) return { label: "Inválida", color: "text-red-400 bg-red-500/20 border-red-500/30" };
    if (len < 8) return { label: "Débil", color: "text-red-400 bg-red-500/20 border-red-500/30" };
    
    let activeTypes = 0;
    if (up) activeTypes++;
    if (low) activeTypes++;
    if (num) activeTypes++;
    if (sym) activeTypes++;

    if (len < 12 || activeTypes < 3) return { label: "Buena", color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" };
    return { label: "Muy Segura", color: "text-green-400 bg-green-500/20 border-green-500/30" };
  };

  const generatePassword = useCallback((manualOptions?: GeneratorOptions): string => {
    const optLength = manualOptions?.length ?? length;
    const optUpper = manualOptions?.uppercase ?? uppercase;
    const optLower = manualOptions?.lowercase ?? lowercase;
    const optNum = manualOptions?.numbers ?? numbers;
    const optSym = manualOptions?.symbols ?? symbols;

    let chars = "";
    if (optUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (optLower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (optNum)   chars += "0123456789";
    if (optSym)   chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (chars === "") {
        if (!manualOptions) setGeneratedPassword("SELECCIONA_AL_MENOS_UNO");
        return "SELECCIONA_AL_MENOS_UNO";
    }

    const array = new Uint32Array(optLength);
    crypto.getRandomValues(array);
    
    let generated = "";
    for (let i = 0; i < optLength; i++) {
        generated += chars[array[i] % chars.length];
    }
    
    if (!manualOptions) {
        setGeneratedPassword(generated);
    }
    
    return generated;
  }, [length, uppercase, lowercase, numbers, symbols]);

  useEffect(() => {
    generatePassword();
  }, [length, uppercase, lowercase, numbers, symbols, generatePassword]);

  return { 
    password: generatedPassword, 
    generatePassword, 
    length, setLength,
    uppercase, setUppercase,
    lowercase, setLowercase,
    numbers, setNumbers,
    symbols, setSymbols,
    strength: getStrength(length, uppercase, lowercase, numbers, symbols)
  };
}
