import { Search, Copy, Eye, ExternalLink } from "lucide-react";

export default function MisClavesPage() {
  const fakeData = [
    {
      id: 1,
      website: "google.com",
      username: "miguel@gmail.com",
      status: "safe", // 'safe' | 'leaked'
      favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=64"
    },
    {
      id: 2,
      website: "facebook.com",
      username: "miguel.garcia@outlook.com",
      status: "leaked",
      favicon: "https://www.google.com/s2/favicons?domain=facebook.com&sz=64"
    },
    {
      id: 3,
      website: "github.com",
      username: "miguelg-dev",
      status: "safe",
      favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64"
    }
  ];

  return (
    <div className="flex flex-col h-full gap-5 md:gap-8 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] md:text-[32px] font-extrabold text-slate-900">Mis Claves</h1>
          <span className="text-sm font-semibold text-slate-500 mt-1.5 md:mt-2">10 claves</span>
        </div>
      </div>

      <div className="w-full relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full bg-white border border-slate-200 text-slate-900 text-[15px] rounded-[14px] pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-slate-400"
          placeholder="Buscar..."
        />
      </div>

      <div className="flex flex-col gap-3">
        {fakeData.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-[14px] border border-transparent transition-all group ${
              item.status === "leaked" ? "border-red-200" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-white border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                <img src={item.favicon} alt={item.website} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 leading-tight">{item.website}</span>
                <span className="text-xs text-slate-500">{item.username}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {item.status === "safe" ? (
                <div className="bg-green-100 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-bold text-green-800">Seguro</span>
                </div>
              ) : (
                <div className="bg-red-100 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-bold text-red-800">Filtrada</span>
                </div>
              )}

              <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

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
          </div>
        ))}
      </div>
    </div>
  );
}
