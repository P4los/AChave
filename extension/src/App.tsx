import { Routes, Route, Navigate } from "react-router-dom";
import { useCrypto } from "./context/CryptoContext";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import ClavesPage from "./pages/ClavesPage";
import GeneradorPage from "./pages/GeneradorPage";
import AjustesPage from "./pages/AjustesPage";
import DashboardLayout from "./components/layout/DashboardLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isLoading } = useCrypto();

  if (isLoading) {
    return (
      <div
        style={{
          width: 390,
          height: 580,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ext-bg-app)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "3px solid var(--ext-border)",
            borderTopColor: "#16A34A",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isUnlocked) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/claves" replace />} />
        <Route path="claves" element={<ClavesPage />} />
        <Route path="generador" element={<GeneradorPage />} />
        <Route path="ajustes" element={<AjustesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/claves" replace />} />
    </Routes>
  );
}
