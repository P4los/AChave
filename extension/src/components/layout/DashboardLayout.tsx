import { useState } from "react";
import { Outlet } from "react-router-dom";
import ExtensionNav from "./ExtensionNav";
import ExtensionHeader from "./ExtensionHeader";
import { CreateVaultModal } from "../modals/CreateVaultModal";

export default function DashboardLayout() {
  const [showVaultModal, setShowVaultModal] = useState(false);

  return (
    <div
      style={{
        width: 390,
        minHeight: 580,
        display: "flex",
        flexDirection: "column",
        background: "var(--ext-bg-app)",
        color: "var(--ext-text-primary)",
        fontFamily: "Inter, sans-serif",
        position: "relative",
      }}
    >
      <ExtensionHeader onOpenVaultModal={() => setShowVaultModal(true)} />

      <main
        style={{
          flex: 1,
          padding: "12px 14px 64px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </main>

      <ExtensionNav />

      {showVaultModal && (
        <CreateVaultModal onClose={() => setShowVaultModal(false)} />
      )}
    </div>
  );
}
