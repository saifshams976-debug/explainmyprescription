import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Knowdose" },
      { name: "description", content: "The terms that apply when you use Knowdose, including acceptable use and liability." },
      { property: "og:title", content: "Terms & Conditions — Knowdose" },
      { property: "og:description", content: "The terms that apply when you use Knowdose." },
    ],
  }),
  component: TermsPage,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl text-foreground mt-8 mb-2">{children}</h2>;
}

function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="By using Knowdose, you agree to these terms. We've tried to keep them short and clear."
      updated="April 2026"
    >
      <H2>Educational purpose only</H2>
      <p>
        Knowdose is an <strong>educational tool</strong>. It helps you understand information about medication in plain language. It is <strong>not</strong> a medical service, diagnosis, or treatment.
      </p>

      <H2>Not a substitute for medical advice</H2>
      <p>
        Information from this service does <strong>not replace professional medical advice</strong>. Always speak to a qualified doctor, pharmacist, or other healthcare professional about your medication, dosage, side effects, and any decisions about your health. Never delay seeking medical advice because of something you read here.
      </p>

      <H2>Liability disclaimer</H2>
      <p>
        We provide this service "as is" and make no guarantees that explanations are complete, accurate, or up to date. To the fullest extent permitted by law, we are not liable for any loss, harm, or damages resulting from your use of, or reliance on, the service. Nothing in these terms limits liability that cannot be excluded by law.
      </p>

      <H2>Acceptable use</H2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Use the service for anything illegal, harmful, or fraudulent</li>
        <li>Submit content that isn't yours or that you don't have permission to share</li>
        <li>Try to break, overload, or reverse-engineer the service</li>
        <li>Use the service to provide medical advice to others as if you were qualified to do so</li>
      </ul>

      <H2>Your account</H2>
      <p>
        If you create an account, you're responsible for keeping your login details secure and for activity under your account.
      </p>

      <H2>Intellectual property</H2>
      <p>
        The site, branding, design, and original content are owned by Knowdose. You may use the service for personal, non-commercial use. Don't copy, resell, or redistribute the service without permission. Content you submit remains yours.
      </p>

      <H2>Termination</H2>
      <p>
        You can stop using the service or delete your account at any time. We may suspend or close accounts that breach these terms or misuse the service.
      </p>

      <H2>Changes to the service or terms</H2>
      <p>
        We may update the service and these terms over time. Continued use after changes means you accept the updated terms.
      </p>

      <H2>Governing law</H2>
      <p>
        These terms are governed by the laws of England and Wales, unless local consumer law gives you stronger rights.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:hello@knowdose.app" className="text-primary hover:underline">
          hello@knowdose.app
        </a>.
      </p>
    </LegalPage>
  );
}
