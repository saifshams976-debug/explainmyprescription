import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ShieldCheck, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { PrescriptionInput } from "@/components/PrescriptionInput";
import { MedicationCard } from "@/components/MedicationCard";
import { ExamplePreview } from "@/components/ExamplePreview";
import { LoadingState } from "@/components/LoadingState";
import type { ExplanationResponse } from "@/lib/types";
import heroImg from "@/assets/hero-pills.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explain My Prescription — Understand your medication in seconds" },
      { name: "description", content: "Upload or type your prescription and get a clear, friendly explanation. Like a pharmacist in your pocket." },
      { property: "og:title", content: "Explain My Prescription" },
      { property: "og:description", content: "Understand your medication in seconds — friendly, simple, trustworthy." },
    ],
  }),
  component: Index,
});

function Index() {
  const [loading, setLoading] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [result, setResult] = useState<ExplanationResponse | null>(null);

  const handleSubmit = async (input: string, imageBase64?: string) => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("explain-prescription", {
        body: { input, imageBase64, simplify },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ExplanationResponse);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <img
          src={heroImg}
          alt=""
          width={1280}
          height={960}
          className="absolute right-0 top-0 -z-10 w-[55%] max-w-3xl opacity-70 hidden md:block pointer-events-none"
        />

        <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-soft)]">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg tracking-tight">Explain My Prescription</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-card/70 backdrop-blur px-3 py-1.5 rounded-full border border-border/50">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Private & secure
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-10 sm:pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-primary-soft text-primary mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by AI · Reviewed in seconds
            </div>
            <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-[1.05] text-foreground">
              Understand your <span className="italic text-primary">medication</span> in seconds.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Upload or type your prescription and get a clear, simple explanation — like a friendly pharmacist sitting next to you.
            </p>
          </div>
        </section>
      </div>

      {/* Input + results */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 pb-20 -mt-4 space-y-6">
        <PrescriptionInput onSubmit={handleSubmit} loading={loading} />

        <div className="flex items-center justify-between bg-card rounded-2xl px-5 py-3.5 border border-border/50 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-sm font-medium">Explain like I'm 12</p>
            <p className="text-xs text-muted-foreground">Even simpler, friendlier language</p>
          </div>
          <Switch checked={simplify} onCheckedChange={setSimplify} />
        </div>

        <div id="results" className="space-y-6 scroll-mt-8">
          {loading && <LoadingState />}
          {!loading && !result && <ExamplePreview />}
          {result?.medications.map((med, i) => <MedicationCard key={i} med={med} />)}
        </div>

        {/* Premium placeholder */}
        {result && (
          <div className="rounded-3xl p-6 border border-primary/20 bg-gradient-to-br from-primary-soft to-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[image:var(--gradient-primary)] flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Get a detailed personalised report</p>
              <p className="text-sm text-muted-foreground">Tailored to your age, conditions, and other medications.</p>
            </div>
            <button className="text-sm font-medium text-primary hover:underline shrink-0 hidden sm:block">Coming soon</button>
          </div>
        )}
      </main>

      {/* Disclaimer footer */}
      <footer className="border-t border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-success" />
            This is not medical advice. Always consult your doctor or pharmacist before making changes to your medication.
          </p>
        </div>
      </footer>
    </div>
  );
}
