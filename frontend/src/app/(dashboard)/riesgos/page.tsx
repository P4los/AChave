import { TriangleAlert, Copy, Eye, ExternalLink } from "lucide-react";

export default function RiesgosPage() {
  const fakeLeakedData = [
    {
      id: 2,
      website: "facebook.com",
      username: "miguel.garcia@outlook.com",
      status: "leaked",
      reason: "Filtrada en Kaggle · 2024",
      favicon: "https://www.google.com/s2/favicons?domain=facebook.com&sz=64"
    }
  ];

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900 mb-2">Riesgos</h1>
          <p className="text-sm font-semibold text-slate-500">
            Analizamos tus contraseñas en bases de datos vulneradas para mantenerte seguro.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-[14px] p-4">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <TriangleAlert className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-red-800">1 clave comprometida</span>
            <span className="text-[13px] text-red-700">Cámbiala lo antes posible por seguridad.</span>
          </div>
        </div>

        <div className="flex flex-col mt-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Filtraciones detectadas</h2>
          <div className="flex flex-col gap-3">
            {fakeLeakedData.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-[14px] border border-red-200 transition-all gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-white border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                    <img src={item.favicon} alt={item.website} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-900 leading-tight">{item.website}</span>
                    <span className="text-[13px] text-slate-500">{item.username}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                  <div className="bg-red-100 px-2 py-1 rounded-lg">
                    <span className="text-[12px] font-bold text-red-800">{item.reason}</span>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-2">
                    <button className="text-slate-400 hover:text-slate-900 transition-colors p-1.5">
                      <Copy className="h-5 w-5" />
                    </button>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors p-1.5">
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors p-1.5">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <button className="md:hidden w-full mt-2 bg-red-500 text-white rounded-xl py-3 font-bold text-[15px] hover:bg-red-600 transition-colors">
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
