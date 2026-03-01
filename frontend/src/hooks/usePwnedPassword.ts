import { useState, useEffect } from 'react';

export function usePwnedPassword(password: string) {
  const [isCheckingVuln, setIsCheckingVuln] = useState(false);
  const [isVulnerable, setIsVulnerable] = useState<boolean | null>(null);

  useEffect(() => {
    // Solo comprobamos contraseñas que tengan sentido para HIBP (normalmente >0 pero por optimización >= 8)
    if (!password || password.length < 8) {
      setIsVulnerable(null);
      setIsCheckingVuln(false);
      return;
    }

    setIsCheckingVuln(true);
    
    // Hacemos debounce para no hacer spam a la API de pwnedpasswords
    const timeoutId = setTimeout(async () => {
      try {
        // 1. Generar el hash SHA-1 de la contraseña
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        // 2. Separar prefijo (5 chars) y sufijo
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);
        
        // 3. Llamar a la API de HIBP (solo enviamos el prefijo)
        const vulnRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!vulnRes.ok) throw new Error();
        
        const text = await vulnRes.text();
        
        // 4. Revisar si el sufijo está en la respuesta
        const lines = text.split('\n');
        // El formato de la API trae carriage returns al final de cada línea \r, así que limpiamos
        const match = lines.find(line => line.trim().startsWith(suffix));
        
        setIsVulnerable(!!match);
      } catch (err) {
        setIsVulnerable(null);
      } finally {
        setIsCheckingVuln(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password]);

  return { isCheckingVuln, isVulnerable };
}
