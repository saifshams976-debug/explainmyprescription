import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getGuestAccess, startGuestAccess } from "./guest-access.functions";

function pickGreeting(name: string) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const options = [`Welcome back, ${name}`, `Hello, ${name}`, `${timeOfDay}, ${name}`, `Hey ${name}, glad you're here`];
  return options[Math.floor(Math.random() * options.length)];
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, isGuest: false, continueAsGuest: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestActive, setGuestActive] = useState(false);
  const checkGuest = useServerFn(getGuestAccess);
  const startGuest = useServerFn(startGuestAccess);

  useEffect(() => {
    let active = true;
    checkGuest().then((data) => { if (active) setGuestActive(data.active); }).catch(() => {});
    return () => { active = false; };
  }, [checkGuest]);

  const greetedRef = useRef(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      if (event === "SIGNED_IN" && s?.user && !greetedRef.current) {
        greetedRef.current = true;
        const name =
          (s.user.user_metadata?.display_name as string | undefined) ||
          (s.user.user_metadata?.full_name as string | undefined) ||
          (s.user.email ? s.user.email.split("@")[0] : "there");
        setTimeout(() => toast.success(pickGreeting(name)), 300);
      }
      if (event === "SIGNED_OUT") greetedRef.current = false;
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) greetedRef.current = true;
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        isGuest: !session && guestActive,
        continueAsGuest: async () => {
          const result = await startGuest();
          if (!result.active) throw new Error("Guest access is temporarily unavailable.");
          setGuestActive(true);
        },
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
