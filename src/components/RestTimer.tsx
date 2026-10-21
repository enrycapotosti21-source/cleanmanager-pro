'use client';
import { useEffect, useRef, useState } from 'react';

export default function RestTimer({ seconds, runKey, onClose }: { seconds: number; runKey: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds);
  const end = useRef(0);
  useEffect(() => {
    end.current = Date.now() + seconds * 1000; setLeft(seconds);
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((end.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) { clearInterval(id); navigator.vibrate?.([200, 100, 200]); }
    }, 250);
    return () => clearInterval(id);
  }, [seconds, runKey]);
  const m = Math.floor(left / 60), s = String(left % 60).padStart(2, '0');
  return (
    <div className="fixed bottom-16 inset-x-0 z-10 px-4"><div className="mx-auto max-w-md rounded-2xl bg-emerald-600 text-white p-4 flex items-center justify-between shadow-lg">
      <div><p className="text-xs uppercase opacity-80">Recupero</p><p className="text-3xl font-bold tabular-nums">{left === 0 ? 'Via!' : `${m}:${s}`}</p></div>
      <div className="flex gap-2"><button className="rounded-xl bg-white/20 px-3 py-2" onClick={() => end.current += 30000}>+30″</button><button className="rounded-xl bg-white/20 px-3 py-2" onClick={onClose}>Chiudi</button></div>
    </div></div>
  );
}
