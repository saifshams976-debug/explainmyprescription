import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur mt-12">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 sm:items-start">
          <div>
            <p className="font-display text-lg text-foreground">Knowdose</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t("footer.about")}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:justify-self-end">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.privacy")}
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.terms")}
            </Link>
            <Link to="/medical-disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.disclaimer")}
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.contact")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            {t("footer.note")}
          </p>
          <p className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} Knowdose
          </p>
        </div>
      </div>
    </footer>
  );
}
