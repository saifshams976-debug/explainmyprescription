import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, GitCompareArrows, AlertTriangle, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface ComparisonResult {
  summary: string;
  interactions: { severity: "low" | "moderate" | "high"; medications: string[]; description: string }[];
  combinedSideEffects: string[];
  safetyTips: string[];
}

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare medications — Knowdose" },
      { name: "description", content: "Check how two or more of your medications interact, with side effects and safety tips explained in plain language." },
      { property: "og:title", content: "Compare medications — Knowdose" },
      { property: "og:description", content: "Check how your medications interact, with side effects and safety tips in plain English." },
      { property: "og:url", content: "https://knowdose.lovable.app/compare" },
    ],
    links: [
      { rel: "canonical", href: "https://knowdose.lovable.app/compare" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meds, setMeds] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const update = (i: number, v: string) => setMeds((m) => m.map((x, idx) => (idx === i ? v : x)));
  const add = () => setMeds((m) => [...m, ""]);
  const remove = (i: number) => setMeds((m) => m.filter((_, idx) => idx !== i));

  const submit = async () => {
    const list = meds.map((m) => m.trim()).filter(Boolean);
    if (list.length < 2) {
      toast.error("Add at least 2 medications");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("compare-medications", {
        body: { medications: list },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ComparisonResult);
    } catch (e: any) {
      toast.error(e.message || "Couldn't compare. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const severityStyles: Record<string, string> = {
    low: "bg-success-soft text-foreground border-success/20",
    moderate: "bg-warning-soft text-foreground border-warning/30",
    high: "bg-destructive-soft text-foreground border-destructive/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight flex items-center gap-3">
            <GitCompareArrows className="w-7 h-7 text-primary" />
            Compare medications
          </h1>
          <p className="text-muted-foreground mt-2">
            Add the medications you take and we'll explain how they interact, in simple language.
          </p>
        </div>

        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-card)] border border-border/50 space-y-3">
          {meds.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={m}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`Medication ${i + 1} (e.g. Ibuprofen 200mg)`}
                aria-label={`Medication ${i + 1}`}
                className="rounded-xl"
              />
              {meds.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={add} className="rounded-xl">
              <Plus className="w-4 h-4" /> Add another medication
            </Button>
            <Button
              onClick={submit}
              disabled={loading}
              className="flex-1 rounded-xl bg-[image:var(--gradient-primary)]"
            >
              <Sparkles className="w-4 h-4" />
              Compare medications
            </Button>
          </div>
        </div>

        {loading && <LoadingState />}

        {result && (
          <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-card)] border border-border/50 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="font-display text-xl tracking-tight mb-2">Summary</h2>
              <p className="text-foreground/85 leading-relaxed">{result.summary}</p>
            </div>

            {result.interactions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Interactions</h3>
                <div className="space-y-3">
                  {result.interactions.map((int, i) => (
                    <div key={i} className={`rounded-2xl p-4 border ${severityStyles[int.severity]}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium text-sm capitalize">{int.severity} interaction</span>
                        <span className="text-xs text-muted-foreground">· {int.medications.join(" + ")}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{int.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.combinedSideEffects.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Increased side effects</h3>
                <ul className="space-y-1.5 text-sm">
                  {result.combinedSideEffects.map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-warning-foreground">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.safetyTips.length > 0 && (
              <div className="rounded-2xl p-5 bg-primary-soft">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Safety tips
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {result.safetyTips.map((t, i) => (
                    <li key={i} className="flex gap-2"><span className="text-primary">•</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground/80 text-center italic">
              For general information only — not medical advice. Always check with your doctor or pharmacist.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
