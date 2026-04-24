import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

interface Props {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}

export function LegalPage({ title, intro, updated, children }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-foreground">{title}</h1>
          {intro && <p className="mt-3 text-muted-foreground leading-relaxed">{intro}</p>}
          {updated && <p className="mt-3 text-xs text-muted-foreground/80">Last updated: {updated}</p>}
        </header>
        <article className="prose-legal space-y-6 text-foreground/90 leading-relaxed text-[15px]">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
