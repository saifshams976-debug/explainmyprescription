import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MedMate" },
      { name: "description", content: "How MedMate handles your data, AI processing, cookies, and your rights under GDPR." },
      { property: "og:title", content: "Privacy Policy — MedMate" },
      { property: "og:description", content: "How we handle your data, AI processing, and your rights under GDPR." },
    ],
  }),
  component: PrivacyPage,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl text-foreground mt-8 mb-2">{children}</h2>;
}

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Your privacy matters. This page explains, in plain English, what data we collect, how it's used, and the rights you have."
      updated="April 2026"
    >
      <H2>What we collect</H2>
      <p>
        We collect only what's needed to give you a useful explanation of your medication:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Prescription text or images</strong> you type or upload, so our AI can explain them.</li>
        <li><strong>Account details</strong> (email and display name) if you choose to sign in.</li>
        <li><strong>Saved medications and reminders</strong> only if you explicitly save them while signed in.</li>
        <li><strong>Basic technical data</strong> (browser type, anonymised usage) to keep the service running smoothly.</li>
      </ul>

      <H2>What we don't store</H2>
      <p>
        Prescription text and images submitted for one-off explanations are <strong>not stored permanently</strong>. They're processed to generate your explanation and then discarded. Data is only kept when you choose to save it to your account.
      </p>

      <H2>How your data is processed (AI)</H2>
      <p>
        To produce explanations, your prescription input is sent to a trusted AI provider for processing. The data is used solely to generate your response and is not used to train models. We don't share your input with advertisers or third parties for marketing.
      </p>

      <H2>GDPR &amp; UK data protection</H2>
      <p>
        If you're in the UK or EU, you have rights under UK GDPR and the EU GDPR, including:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Access a copy of the data we hold about you</li>
        <li>Correct anything that's wrong</li>
        <li>Delete your account and saved data at any time</li>
        <li>Object to or restrict certain processing</li>
        <li>Lodge a complaint with the UK ICO or your local data protection authority</li>
      </ul>
      <p>To exercise any of these, just email us (see Contact below).</p>

      <H2>Cookies</H2>
      <p>
        We use a small number of essential cookies and similar storage to keep you signed in and remember basic preferences. We don't use advertising cookies or third-party trackers.
      </p>

      <H2>Security</H2>
      <p>
        Data is transmitted over HTTPS. Saved data is protected by access rules so only you can see your own medications and reminders.
      </p>

      <H2>Children</H2>
      <p>
        This service isn't intended for children under 16. Please don't use it on behalf of a child without a parent or guardian.
      </p>

      <H2>Changes to this policy</H2>
      <p>
        If we make material changes, we'll update the "Last updated" date and, where appropriate, notify you in the app.
      </p>

      <H2>Contact</H2>
      <p>
        For privacy questions or to exercise your data rights, email{" "}
        <a href="mailto:privacy@medmate.app" className="text-primary hover:underline">
          privacy@medmate.app
        </a>.
      </p>
    </LegalPage>
  );
}
