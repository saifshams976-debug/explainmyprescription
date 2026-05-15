import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, ArrowLeft, Eye, Trash2, Bell, BellOff, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MedicationCard } from "@/components/MedicationCard";
import { SiteHeader } from "@/components/SiteHeader";
import { syncReminders } from "@/lib/reminders";
import type { Medication } from "@/lib/types";
import { toast } from "sonner";

interface SavedMed {
  id: string;
  name: string;
  explanation: Medication;
  created_at: string;
}

interface Reminder {
  id: string;
  medication_name: string;
  time_of_day: string;
  label: string | null;
  enabled: boolean;
  saved_medication_id: string | null;
}

export const Route = createFileRoute("/my-medications")({
  head: () => ({
    meta: [
      { title: "My Medications — Knowdose" },
      { name: "description", content: "View your saved medication explanations, manage reminders, and quickly access prescriptions you've looked up before." },
      { property: "og:title", content: "My Medications — Knowdose" },
      { property: "og:description", content: "Your saved medication explanations and reminders, all in one place." },
      { property: "og:url", content: "https://knowdose.lovable.app/my-medications" },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "canonical", href: "https://knowdose.lovable.app/my-medications" },
    ],
  }),
  component: MyMedications,
});

function MyMedications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meds, setMeds] = useState<SavedMed[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("saved_medications").select("*").order("created_at", { ascending: false }),
      supabase.from("reminders").select("*").order("time_of_day"),
    ]).then(([m, r]) => {
      if (m.data) setMeds(m.data as any);
      if (r.data) {
        setReminders(r.data as any);
        syncReminders(r.data as any);
      }
      setLoading(false);
    });
  }, [user]);

  const removeMed = async (id: string) => {
    const { error } = await supabase.from("saved_medications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMeds((m) => m.filter((x) => x.id !== id));
    if (openId === id) setOpenId(null);
    toast.success("Removed");
  };

  const toggleReminder = async (r: Reminder) => {
    const { error } = await supabase.from("reminders").update({ enabled: !r.enabled }).eq("id", r.id);
    if (error) return toast.error(error.message);
    const updated = reminders.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x));
    setReminders(updated);
    syncReminders(updated);
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    syncReminders(updated);
  };

  if (authLoading || !user) return null;

  const openMed = meds.find((m) => m.id === openId);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> New explanation
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">My Medications</h1>
          <p className="text-muted-foreground mt-2">Saved explanations and reminders, ready when you need them.</p>
        </div>

        {/* Saved meds */}
        <section>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4" /> Saved
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : meds.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
              <p className="text-muted-foreground">No saved medications yet.</p>
              <Button asChild className="mt-4 rounded-xl bg-[image:var(--gradient-primary)]">
                <Link to="/">Explain a prescription</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {meds.map((m) => (
                <li key={m.id} className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(m.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setOpenId(openId === m.id ? null : m.id)} className="rounded-xl">
                    <Eye className="w-3.5 h-3.5" />
                    {openId === m.id ? "Hide" : "View"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeMed(m.id)} aria-label="Remove">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {openMed && (
            <div className="mt-5">
              <MedicationCard med={openMed.explanation} initialSavedId={openMed.id} hideSave />
            </div>
          )}
        </section>

        {/* Reminders */}
        <section>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Reminders
          </h2>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-card rounded-2xl p-5 border border-border/50">
              No reminders yet. Set one from any medication explanation.
            </p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li key={r.id} className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">{r.time_of_day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.medication_name}</p>
                    <p className="text-xs text-muted-foreground">{r.label || "Custom"}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleReminder(r)} aria-label="Toggle">
                    {r.enabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteReminder(r.id)} aria-label="Delete">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Reminders use browser notifications and only fire while this app is open in your browser.
          </p>
        </section>
      </main>
    </div>
  );
}
