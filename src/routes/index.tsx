import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, Crown, GitCompareArrows, BookmarkCheck, Lock, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { PrescriptionInput } from "@/components/PrescriptionInput";
import { MedicationCard } from "@/components/MedicationCard";
import { ExamplePreview } from "@/components/ExamplePreview";
import { LoadingState } from "@/components/LoadingState";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ExplanationResponse } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { syncReminders } from "@/lib/reminders";
import heroImg from "@/assets/hero-pills.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Knowdose — Understand your medication in seconds" },
      { name: "description", content: "Upload or type your prescription and get a clear, friendly explanation. Like a pharmacist in your pocket." },
      { property: "og:title", content: "Knowdose — Understand your medication in seconds" },
      { property: "og:description", content: "Upload or type your prescription and get a clear, friendly explanation in plain English." },
      { property: "og:url", content: "https://knowdose.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://knowdose.lovable.app/" },
    ],
  }),
  component: Index,
});

const examples = ["Amoxicillin 500mg", "Ibuprofen 400mg", "Lisinopril 10mg"];

function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, string>>({});
  const [exampleSeed, setExampleSeed] = useState<string>("");

  // Sync reminders into the browser scheduler
  useEffect(() => {
    if (!user) return;
    supabase.from("reminders").select("*").then(({ data }) => {
      if (data) syncReminders(data as any);
    });
    supabase.from("saved_medications").select("id, name").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        for (const r of data) map[r.name.toLowerCase()] = r.id;
        setSavedIds(map);
      }
    });
  }, [user]);

  const handleSubmit = async (input: string, imageBase64?: string) => {
    if (!user) {
      toast.info("Please sign in to get an explanation.");
      navigate({ to: "/auth" });
      return;
    }
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

        <SiteHeader />

        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-10 sm:pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-primary-soft text-primary mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by AI · Reviewed in seconds
            </div>
            <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-[1.05] text-foreground">
              See what your <span className="italic text-primary">medication</span> actually does in seconds.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Upload or type your prescription and get a clear, simple explanation — like a friendly pharmacist sitting next to you.
            </p>
            <p className="mt-4 text-sm text-muted-foreground/90 max-w-xl">
              Designed to help patients understand prescriptions in clear, simple language.
            </p>
          </div>
        </section>
      </div>

      {/* Input + results */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 pb-20 -mt-4 space-y-6">
        <PrescriptionInput onSubmit={handleSubmit} loading={loading} seedText={exampleSeed} />

        {/* Trust strip — your privacy matters */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-success" />
            No data stored unless you save it
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            Educational use only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            UK GDPR compliant
          </span>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Try it with:</span>
          {examples.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setExampleSeed(e + " · " + Date.now())}
              className="px-3 py-1.5 rounded-full bg-card border border-border/60 hover:border-primary/40 hover:bg-primary-soft text-foreground/85 transition-colors"
            >
              {e.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl px-5 py-3.5 border border-border/50 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-sm font-medium">Explain like I'm 12</p>
            <p className="text-xs text-muted-foreground">Even simpler, friendlier language</p>
          </div>
          <Switch checked={simplify} onCheckedChange={setSimplify} aria-label="Explain like I'm 12" />
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            to="/compare"
            className="group bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/40 transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
              <GitCompareArrows className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Compare medications</p>
              <p className="text-xs text-muted-foreground">Check interactions in plain English</p>
            </div>
          </Link>
          <Link
            to={user ? "/my-medications" : "/auth"}
            className="group bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/40 transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">My Medications</p>
              <p className="text-xs text-muted-foreground">{user ? "View your saved meds & reminders" : "Sign in to save medications"}</p>
            </div>
          </Link>
        </div>

        <div id="results" className="space-y-6 scroll-mt-8">
          <h2 className="sr-only">Your medication explanation</h2>
          {loading && <LoadingState />}
          {!loading && !result && <ExamplePreview />}
          {result && result.medications.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-primary/90 font-medium px-1">
                <Sparkles className="w-4 h-4" />
                Here is a simple explanation of your medication:
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-xs text-muted-foreground inline-flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-success shrink-0" />
                <span>
                  General information to help you understand your medication. Always confirm details with your doctor or pharmacist.{" "}
                  <Link to="/medical-disclaimer" className="text-primary hover:underline">Read the full disclaimer</Link>.
                </span>
              </div>
            </>
          )}
          {result?.medications.map((med, i) => (
            <MedicationCard key={i} med={med} initialSavedId={savedIds[med.name.toLowerCase()] ?? null} />
          ))}
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

      <SiteFooter />
    </div>
  );
}
