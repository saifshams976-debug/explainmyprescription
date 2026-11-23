import { UserRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function GuestOption({ onContinue }: { onContinue?: () => void }) {
  const { continueAsGuest } = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  return (
    <div className="text-center space-y-2">
      <Button variant="outline" disabled={busy} className="w-full rounded-xl" onClick={async () => {
        setBusy(true);
        try {
          await continueAsGuest();
          onContinue?.();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("guest.unavailable"));
        } finally { setBusy(false); }
      }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserRound className="w-4 h-4" />}
        {t(busy ? "guest.starting" : "guest.continue")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("guest.note")}</p>
    </div>
  );
}