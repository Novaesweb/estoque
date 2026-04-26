import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show after a small delay to not annoy the user immediately
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-24 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[110] pointer-events-auto"
        >
          <div className="bg-operarank-dark/90 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-2xl flex items-center gap-4">
            <div className="bg-operarank-accent/20 p-3 rounded-2xl">
              <Smartphone className="text-operarank-accent" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">App Disponível</p>
              <h3 className="text-sm font-bold text-white">Instalar OperaRank</h3>
              <p className="text-[10px] text-white/60">Acesse mais rápido direto da sua tela inicial.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleInstall}
                className="bg-operarank-accent hover:bg-operarank-accent/80 text-white p-2.5 rounded-xl transition-colors shadow-lg shadow-operarank-accent/20"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="bg-white/5 hover:bg-white/10 text-white/40 p-2.5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
