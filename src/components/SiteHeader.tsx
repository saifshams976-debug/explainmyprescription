import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, LogOut, BookmarkCheck, GitCompareArrows, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 flex items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-9 h-9 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-soft)] group-hover:scale-105 transition-transform">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg tracking-tight">Knowdose</span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-card/70 backdrop-blur px-3 py-1.5 rounded-full border border-border/50">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          Private & secure
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[140px] truncate">
                  {user.user_metadata?.display_name || user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate({ to: "/my-medications" })}>
                <BookmarkCheck className="w-4 h-4 mr-2" /> My Medications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/compare" })}>
                <GitCompareArrows className="w-4 h-4 mr-2" /> Compare medications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm" className="rounded-full bg-[image:var(--gradient-primary)]">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
