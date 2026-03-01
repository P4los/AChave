import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { CryptoProvider } from "./context/CryptoContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: "13px",
            fontWeight: "600",
            borderRadius: "12px",
            padding: "8px 14px",
          },
        }}
      />
      <ThemeProvider>
        <CryptoProvider>
          <App />
        </CryptoProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
);
