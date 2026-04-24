import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { Mail, Lock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — MedMate" },
      { name: "description", content: "Get in touch with the MedMate team for support, privacy queries, or feedback." },
      { property: "og:title", content: "Contact — MedMate" },
      { property: "og:description", content: "Reach our team for support, privacy queries, or feedback." },
    ],
  }),
  component: ContactPage,
});

function ContactCard({ icon, title, description, email }: { icon: React.ReactNode; title: string; description: string; email: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        <a href={`mailto:${email}`} className="text-sm text-primary hover:underline mt-2 inline-block break-all">
          {email}
        </a>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      intro="We'd love to hear from you. Choose the option that fits and we'll come back to you as soon as we can."
    >
      <div className="grid sm:grid-cols-1 gap-4 not-prose">
        <ContactCard
          icon={<MessageCircle className="w-4 h-4" />}
          title="General questions & feedback"
          description="Ideas, bugs, or anything else."
          email="hello@medmate.app"
        />
        <ContactCard
          icon={<Lock className="w-4 h-4" />}
          title="Privacy & data requests"
          description="GDPR requests, deletions, or privacy concerns."
          email="privacy@medmate.app"
        />
        <ContactCard
          icon={<Mail className="w-4 h-4" />}
          title="Account help"
          description="Trouble signing in or managing saved medications."
          email="support@medmate.app"
        />
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        Please don't include sensitive medical information in emails. For anything urgent or medical, contact your doctor, pharmacist, or local emergency services.
      </p>
    </LegalPage>
  );
}
