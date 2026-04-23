import { Pill, Clock, AlertCircle } from "lucide-react";

export function ExamplePreview() {
  return (
    <div className="bg-card/60 backdrop-blur rounded-3xl p-6 border border-border/50 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Example output</p>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center">
          <Pill className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display text-xl">Ibuprofen 400mg</h3>
          <p className="text-sm text-muted-foreground">Helps with pain and reduces swelling</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-secondary/60 rounded-2xl p-4 text-sm">
          <div className="flex items-center gap-2 mb-1.5 text-foreground/70"><Clock className="w-4 h-4" /><span className="font-medium text-xs">How to take it</span></div>
          With food, every 6-8 hours. Don't take more than 3 doses in 24 hours.
        </div>
        <div className="bg-warning-soft rounded-2xl p-4 text-sm">
          <div className="flex items-center gap-2 mb-1.5 text-warning-foreground"><AlertCircle className="w-4 h-4" /><span className="font-medium text-xs">Common effects</span></div>
          Mild stomach upset, especially on an empty stomach.
        </div>
      </div>
    </div>
  );
}
