import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAppStore } from "../store/useAppStore";

export function NotificationManager() {
  const { user, config } = useAppStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const enabled = config.notificationsEnabled;

  useEffect(() => {
    if (!user?.uid || !enabled) {
      setNotifications([]);
      return;
    }

    try {
      const q = query(
        collection(db, "users", user.uid, "notifications"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      return onSnapshot(q, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
             const data = change.doc.data();
             if (data.createdAt?.toDate && (Date.now() - data.createdAt.toDate().getTime() < 10000)) {
                try {
                   if ("Notification" in window && Notification.permission === "granted") {
                       new Notification(data.title, { body: data.body });
                   }
                } catch(e) {}
             }
          }
        });
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
         console.warn("Notifications listener error (likely permissions):", err);
      });
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
    }
  }, [user?.uid, enabled]);

  if (!user || !enabled || notifications.length === 0) return null;

  const unread = notifications.filter(n => !n.read);
  if (unread.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-80 z-[100] pointer-events-none">
      <AnimatePresence>
        {unread.slice(0, 3).map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.5 }}
            className="bg-[#6366f1] text-white p-4 rounded-2xl shadow-2xl mb-2 flex items-start gap-4 pointer-events-auto border border-white/20 backdrop-blur-xl"
          >
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-0.5">Alerta Live</p>
              <p className="text-sm font-black truncate">{n.title}</p>
              <p className="text-[10px] font-bold opacity-80 leading-tight">{n.body}</p>
            </div>
            <button 
                onClick={async () => {
                    try {
                        await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
                    } catch(e) {}
                }}
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
                <CheckCircle2 size={16} className="text-white/40" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
