import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
      <span className="h-1.5 w-1.5 rounded-full bg-[#f4c632]" />
      {children}
    </p>
  );
}

export function Waveform({ muted = false }: { muted?: boolean }) {
  return (
    <div
      className={`flex h-9 items-center gap-1 ${muted ? "opacity-35" : ""}`}
      aria-hidden="true"
    >
      {[13, 25, 18, 32, 21, 14, 28, 18, 34, 22, 15, 27, 17, 31, 12, 24].map(
        (height, index) => (
          <span
            className="block w-1 rounded-full bg-current"
            style={{ height }}
            key={index}
          />
        ),
      )}
    </div>
  );
}
