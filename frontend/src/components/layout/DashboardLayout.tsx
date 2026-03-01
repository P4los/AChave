"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { CreateVaultModal } from "../modals/CreateVaultModal";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showVaultModal, setShowVaultModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row">
      <Sidebar onOpenVaultModal={() => setShowVaultModal(true)} />
      <MobileHeader onOpenVaultModal={() => setShowVaultModal(true)} />

      <main className="flex-1 md:ml-[300px] mb-20 md:mb-0 px-5 pt-5 md:px-[64px] pb-5 md:pb-10 md:pt-[56px] min-h-screen relative">
        <div className="max-w-4xl mx-auto w-full h-full">{children}</div>
      </main>

      <MobileNav onOpenVaultModal={() => setShowVaultModal(true)} />

      {showVaultModal && (
        <CreateVaultModal onClose={() => setShowVaultModal(false)} />
      )}
    </div>
  );
}
