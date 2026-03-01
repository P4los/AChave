import { useState, useCallback } from 'react';

export function usePwnedPasswordBatch() {
  const [isCheckingBatch, setIsCheckingBatch] = useState(false);

  const checkBatchVulnerabilities = useCallback(async (passwordsToCheck: { id: string, plainText: string }[]) => {
    setIsCheckingBatch(true);
    const results: { [id: string]: boolean } = {};

    try {
      const batchSize = 10;
      for (let i = 0; i < passwordsToCheck.length; i += batchSize) {
        const batch = passwordsToCheck.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async ({ id, plainText }) => {
          if (!plainText || plainText.length < 8) {
            results[id] = false;
            return;
          }

          try {
            const msgUint8 = new TextEncoder().encode(plainText);
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
            
            results[id] = !!match;
          } catch (e) {
            results[id] = false;
          }
        }));
      }
    } catch (err) {
      console.error("Error comprobando lote de contraseñas:", err);
    } finally {
      setIsCheckingBatch(false);
    }

    return results;
  }, []);

  return { isCheckingBatch, checkBatchVulnerabilities };
}
