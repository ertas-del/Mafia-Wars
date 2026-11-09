import { RotateCw, Smartphone } from 'lucide-react';

/** Full-screen card shown while playing in portrait on a touch device. */
export function RotateCard() {
  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Turn your phone sideways to keep playing"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#09090B] px-8 text-center text-zinc-100"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <Smartphone className="h-16 w-16 rotate-90 text-amber-400" strokeWidth={1.5} aria-hidden="true" />
        <RotateCw className="absolute -right-1 -top-1 h-8 w-8 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="font-display text-lg tracking-wide">Turn your phone sideways to keep playing</p>
    </div>
  );
}
