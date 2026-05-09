import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);

// Sprint F — PWA Service Worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);
        // Prompt reload when a new SW is waiting
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          newSW?.addEventListener("statechange", () => {
            if (newSW.state === "installed" && navigator.serviceWorker.controller) {
              // Dispatch custom event so UI can show "Update available" banner
              window.dispatchEvent(new CustomEvent("aurora-sw-update", { detail: { reg } }));
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] Registration failed:", err));
  });
}

