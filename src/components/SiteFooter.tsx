import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur mt-12">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 sm:items-start">
          <div>
            <p className="font-display text-lg text-foreground">Explain My Prescription</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Helping patients understand medication in clear, simple language. Educational use only — never a substitute for your doctor or pharmacist.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:justify-self-end">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/medical-disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">
              Medical Disclaimer
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            General information only — not medical advice. Always consult your doctor or pharmacist.
          </p>
          <p className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} Explain My Prescription
          </p>
        </div>
      </div>
    </footer>
  );
}
