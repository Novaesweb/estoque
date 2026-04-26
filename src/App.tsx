import * as React from "react";
import SystemApp from "./System.tsx";
import PWAHandler from "./components/PWAHandler.tsx";

export default function App() {
  return (
    <div className="min-h-screen bg-operarank-dark overflow-x-hidden selection:bg-operarank-accent/30 tracking-tight">
      <PWAHandler />
      <SystemApp />
    </div>
  );
}
