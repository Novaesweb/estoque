import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-end">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/40 leading-none mb-1">
        {format(time, "eeee, dd 'de' MMMM", { locale: ptBR })}
      </p>
      <p className="text-lg font-mono font-black tracking-tighter text-white leading-none">
        {format(time, "HH:mm:ss")}
      </p>
    </div>
  );
};
