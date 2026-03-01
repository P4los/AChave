import { Plus, KeyRound, TriangleAlert, Shuffle, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav({ onOpenVaultModal }: { onOpenVaultModal: () => void }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 w-full h-20 bg-white border-t border-slate-200 px-6 pt-3 pb-6 flex justify-between gap-1 items-start z-40">
      <Link href="/claves/nueva" className="flex flex-col items-center gap-1 min-w-[56px]">
        <Plus className={`w-6 h-6 ${pathname.startsWith('/claves/nueva') ? 'text-green-600' : 'text-slate-500'}`} />
        <span className={`text-[11px] ${pathname.startsWith('/claves/nueva') ? 'font-bold text-green-600' : 'font-semibold text-slate-500'}`}>Nueva</span>
      </Link>

      <Link href="/claves" className="flex flex-col items-center gap-1 min-w-[56px]">
        <KeyRound className={`w-6 h-6 ${pathname === '/claves' ? 'text-green-600' : 'text-slate-500'}`} />
        <span className={`text-[11px] ${pathname === '/claves' ? 'font-bold text-green-600' : 'font-semibold text-slate-500'}`}>
          Claves
        </span>
      </Link>

      <Link href="/generador" className="flex flex-col items-center gap-1 min-w-[56px]">
        <Shuffle className={`w-6 h-6 ${pathname.startsWith('/generador') ? 'text-green-600' : 'text-slate-500'}`} />
        <span className={`text-[11px] ${pathname.startsWith('/generador') ? 'font-bold text-green-600' : 'font-semibold text-slate-500'}`}>
          Generar
        </span>
      </Link>

      <Link href="/ajustes" className="flex flex-col items-center gap-1 min-w-[56px]">
        <Settings className={`w-6 h-6 ${pathname.startsWith('/ajustes') ? 'text-green-600' : 'text-slate-500'}`} />
        <span className={`text-[11px] ${pathname.startsWith('/ajustes') ? 'font-bold text-green-600' : 'font-semibold text-slate-500'}`}>
          Ajustes
        </span>
      </Link>
    </div>
  );
}
