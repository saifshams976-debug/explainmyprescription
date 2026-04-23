// Browser-based local reminder scheduling.
// Uses setTimeout while the tab is open + Notification API.

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

interface Reminder {
  id: string;
  medication_name: string;
  time_of_day: string; // HH:MM
  enabled: boolean;
}

const timers = new Map<string, number>();

function msUntilNext(timeOfDay: string): number {
  const [h, m] = timeOfDay.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

function fire(reminder: Reminder) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Medication reminder", {
      body: `Time to take your ${reminder.medication_name}.`,
      icon: "/favicon.ico",
    });
  }
  schedule(reminder); // re-schedule for next day
}

function schedule(reminder: Reminder) {
  cancel(reminder.id);
  if (!reminder.enabled) return;
  const t = window.setTimeout(() => fire(reminder), msUntilNext(reminder.time_of_day));
  timers.set(reminder.id, t);
}

export function cancel(id: string) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
}

export function syncReminders(reminders: Reminder[]) {
  // Cancel removed
  for (const id of timers.keys()) {
    if (!reminders.find((r) => r.id === id)) cancel(id);
  }
  // Schedule active
  for (const r of reminders) schedule(r);
}
