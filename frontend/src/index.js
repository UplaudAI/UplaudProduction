import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Suppress benign "ResizeObserver loop" warning that CRA's dev overlay
// otherwise renders as a full-screen error. Not a real bug.
const RESIZE_OBSERVER_ERR = /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/;
window.addEventListener("error", (e) => {
  if (e.message && RESIZE_OBSERVER_ERR.test(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = e?.reason?.message || String(e?.reason || "");
  if (RESIZE_OBSERVER_ERR.test(msg)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
