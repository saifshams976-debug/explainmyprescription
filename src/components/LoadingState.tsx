import { Pill } from "lucide-react";

export function LoadingState() {
  return (
    <div className="bg-card rounded-3xl p-12 shadow-[var(--shadow-card)] border border-border/50 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)] animate-pulse">
          <Pill className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="absolute inset-0 rounded-3xl bg-primary/30 blur-xl animate-pulse" />
      </div>
      <h3 className="mt-6 font-display text-xl">Analyzing your prescription...</h3>
      <p className="text-sm text-muted-foreground mt-2">Our friendly pharmacist is reading the details</p>
      <div className="mt-6 flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: `${i*150}ms`}} />
        ))}
      </div>
    </div>
  );
}
