import { ShieldCheck, Plus, KeyRound, TriangleAlert, Shuffle, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  { href: '/claves', icon: KeyRound, label: 'Mis Claves' },
  { href: '/riesgos', icon: TriangleAlert, label: 'Riesgos', alert: true },
  { href: '/generador', icon: Shuffle, label: 'Generador' },
  { href: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export function Sidebar({ onOpenVaultModal }: { onOpenVaultModal: () => void }) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex w-[300px] flex-col justify-between h-screen bg-white border-r border-slate-200 px-7 py-10 fixed left-0 top-0">
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-[28px] font-extrabold text-slate-900">AChave</span>
        </div>

        <div className="mb-8">
          <div className="text-sm font-bold text-slate-500 mb-3 px-1 flex items-center justify-between">
            Tus Cofres
            <button 
              onClick={onOpenVaultModal}
              className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              Nuevo Cofre
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-[14px]">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900">Cofre de mg</span>
              <span className="text-[13px] text-slate-500">10 elementos</span>
            </div>
          </div>
        </div>

        <Link 
          href="/claves/nueva"
          className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-[14px] w-full mb-8 hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[15px] font-bold">Nueva Clave</span>
        </Link>

        <nav className="flex flex-col gap-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 p-4 rounded-[14px] transition-colors relative ${
                  isActive ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-slate-400'}`} />
                <span className={`text-[15px] font-bold ${isActive ? 'text-green-700' : 'text-slate-600'}`}>
                  {link.label}
                </span>

                {link.alert && (
                  <div className="absolute right-4 w-2 h-2 rounded-full bg-red-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 px-1 mt-auto">
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">MG</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">Miguel G.</span>
        </div>
      </div>
    </div>
  );
}
