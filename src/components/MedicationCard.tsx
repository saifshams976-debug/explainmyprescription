import { Pill, HelpCircle, Clock, AlertCircle, AlertTriangle, RotateCcw, Wine, Car, UtensilsCrossed, Copy, Check, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { useState } from "react";
import type { Medication } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ReminderDialog } from "./ReminderDialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatShareText } from "@/lib/share";

interface Props {
  med: Medication;
  initialSavedId?: string | null;
  hideSave?: boolean;
}

function Section({ icon: Icon, title, tone = "default", children }: any) {
  const tones: Record<string, string> = {
    default: "bg-secondary/50 text-foreground",
    primary: "bg-primary-soft text-foreground",
    warning: "bg-warning-soft text-foreground",
    danger: "bg-destructive-soft text-foreground border border-destructive/20",
    success: "bg-success-soft text-foreground",
  };
  const iconTones: Record<string, string> = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-warning-foreground",
    danger: "text-destructive",
    success: "text-success",
  };
  return (
    <div className={`rounded-2xl p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-xl bg-background/80 flex items-center justify-center ${iconTones[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

export function MedicationCard({ med, initialSavedId = null, hideSave = false }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialSavedId);
  const [saving, setSaving] = useState(false);

  const copyAll = () => {
    const text = `${med.name}\n\n${med.overview}\n\nWhy: ${med.whyPrescribed}\n\nHow to take: ${med.howToTake.timing} — ${med.howToTake.withFood}\n\nSide effects: ${med.sideEffects.join(", ")}\n\nWarnings: ${med.warnings.join("; ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareSummary = async () => {
    const text = formatShareText(med);
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: `Explain My Prescription — ${med.name}`, text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setShared(true);
    toast.success("Summary copied — ready to share");
    setTimeout(() => setShared(false), 2000);
  };

  const toggleSave = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setSaving(true);
    if (savedId) {
      const { error } = await supabase.from("saved_medications").delete().eq("id", savedId);
      setSaving(false);
      if (error) return toast.error(error.message);
      setSavedId(null);
      toast.success("Removed from My Medications");
    } else {
      const { data, error } = await supabase
        .from("saved_medications")
        .insert({ user_id: user.id, name: med.name, explanation: med as any })
        .select("id")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setSavedId(data.id);
      toast.success("Saved to My Medications");
    }
  };

  return (
    <article className="bg-card rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-card)] border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-soft)]">
            <Pill className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">{med.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{med.overview}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={copyAll} className="shrink-0 rounded-xl" aria-label="Copy explanation">
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </Button>
      </header>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {!hideSave && (
          <Button
            variant={savedId ? "default" : "outline"}
            size="sm"
            onClick={toggleSave}
            disabled={saving}
            className="rounded-xl"
          >
            {savedId ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {savedId ? "Saved" : "Save this medication"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={shareSummary} className="rounded-xl">
          {shared ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
          Share explanation
        </Button>
        <ReminderDialog medicationName={med.name} savedMedicationId={savedId} />
      </div>

      {/* Timeline */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary-soft to-secondary/40 border border-primary/10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Timeline</h3>
        </div>
        <div className="relative">
          <div className="absolute top-3 left-3 right-3 h-0.5 bg-primary/20" />
          <div className="grid grid-cols-2 gap-4 relative">
            <div className="text-center">
              <div className="w-6 h-6 rounded-full bg-primary mx-auto mb-2 ring-4 ring-background relative z-10" />
              <p className="text-xs text-muted-foreground">Starts working</p>
              <p className="text-sm font-medium mt-1">{med.timeline.startsWorking}</p>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 rounded-full bg-primary-glow mx-auto mb-2 ring-4 ring-background relative z-10" />
              <p className="text-xs text-muted-foreground">Side effects may appear</p>
              <p className="text-sm font-medium mt-1">{med.timeline.sideEffectsAppear}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Section icon={HelpCircle} title="Why you were prescribed this" tone="primary">
          {med.whyPrescribed}
        </Section>

        <Section icon={Clock} title="How to take it" tone="default">
          <div className="space-y-1.5">
            <p><span className="font-medium">When:</span> {med.howToTake.timing}</p>
            <p><span className="font-medium">Food:</span> {med.howToTake.withFood}</p>
            {med.howToTake.tips.length > 0 && (
              <ul className="mt-2 space-y-1 list-disc list-inside text-foreground/80">
                {med.howToTake.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
          </div>
        </Section>

        <Section icon={AlertCircle} title="Common side effects" tone="warning">
          <ul className="space-y-1.5">
            {med.sideEffects.map((s, i) => (
              <li key={i} className="flex gap-2"><span className="text-warning-foreground">•</span>{s}</li>
            ))}
          </ul>
        </Section>

        <Section icon={RotateCcw} title="Missed a dose?" tone="default">
          {med.missedDose}
        </Section>
      </div>

      <div className="mt-3">
        <Section icon={AlertTriangle} title="Seek medical help if..." tone="danger">
          <ul className="space-y-1.5">
            {med.warnings.map((w, i) => (
              <li key={i} className="flex gap-2"><span className="text-destructive font-bold">!</span>{w}</li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-3 grid sm:grid-cols-3 gap-3">
        <Section icon={Wine} title="Alcohol" tone="success">{med.lifestyle.alcohol}</Section>
        <Section icon={Car} title="Driving" tone="success">{med.lifestyle.driving}</Section>
        <Section icon={UtensilsCrossed} title="Food" tone="success">{med.lifestyle.food}</Section>
      </div>

      <p className="mt-5 text-xs text-muted-foreground/80 text-center italic">
        For general information only — not medical advice.
      </p>
    </article>
  );
}
