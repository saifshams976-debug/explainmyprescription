import { useState } from "react";
import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ensureNotificationPermission } from "@/lib/reminders";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface Props {
  medicationName: string;
  savedMedicationId?: string | null;
}

const presets = [
  { label: "Morning", time: "08:00" },
  { label: "Afternoon", time: "13:00" },
  { label: "Evening", time: "20:00" },
];

export function ReminderDialog({ medicationName, savedMedicationId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [customTime, setCustomTime] = useState("09:00");
  const [saving, setSaving] = useState(false);

  const save = async (timeOfDay: string, label: string) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setSaving(true);
    const ok = await ensureNotificationPermission();
    if (!ok) {
      toast.error("Please allow notifications to receive reminders.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      saved_medication_id: savedMedicationId ?? null,
      medication_name: medicationName,
      time_of_day: timeOfDay,
      label,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Reminder set for ${timeOfDay}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Bell className="w-4 h-4" />
          Set reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Reminder for {medicationName}</DialogTitle>
          <DialogDescription>
            Pick a time. We'll send a gentle browser notification while this app is open.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                disabled={saving}
                onClick={() => save(p.time, p.label)}
                className="rounded-xl h-auto py-3 flex-col gap-0.5"
              >
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.time}</span>
              </Button>
            ))}
          </div>

          <div className="pt-2 border-t">
            <Label htmlFor="custom-time" className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5" /> Custom time
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-time"
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="flex-1"
              />
              <Button disabled={saving} onClick={() => save(customTime, "Custom")}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
