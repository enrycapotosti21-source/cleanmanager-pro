'use client';
import { useEffect, useState } from 'react';

export default function Photo({ blob, alt, className = '' }: { blob?: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => { if (!blob) { setUrl(undefined); return; } const u = URL.createObjectURL(blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [blob]);
  if (!url) return <div className={`flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 aspect-[3/4] ${className}`}>{alt}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`rounded-xl object-cover aspect-[3/4] w-full ${className}`} />;
}
