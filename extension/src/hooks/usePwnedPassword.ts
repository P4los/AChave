import { useState, useEffect } from 'react';

export function usePwnedPassword(password: string) {
  const [isCheckingVuln, setIsCheckingVuln] = useState(false);
  const [isVulnerable, setIsVulnerable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!password || password.length < 8) {
      setIsVulnerable(null);
      setIsCheckingVuln(false);
      return;
    }

    setIsCheckingVuln(true);
    
    const timeoutId = setTimeout(async () => {
      try {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);
        
        const vulnRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!vulnRes.ok) throw new Error();
        
        const text = await vulnRes.text();
        const lines = text.split('\n');
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
