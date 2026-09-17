"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker after window load to preserve initial page load performance
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("AgriSense PWA ServiceWorker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.debug("AgriSense ServiceWorker registration note:", err);
          });
      });
    }
  }, []);

  return null;
}
