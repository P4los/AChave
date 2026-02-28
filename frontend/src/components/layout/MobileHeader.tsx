import { ShieldCheck, Menu } from 'lucide-react';

export function MobileHeader() {
  return (
    <div className="md:hidden flex items-center justify-between w-full h-16 bg-white px-5 border-b border-slate-200 sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[10px] bg-green-600 flex items-center justify-center">
          <ShieldCheck className="w-[18px] h-[18px] text-white" />
        </div>
        <span className="text-[22px] font-extrabold text-slate-900">AChave</span>
      </div>
      <button className="p-2 -mr-2 text-slate-900">
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
}
