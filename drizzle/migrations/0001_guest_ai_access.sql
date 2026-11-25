CREATE TABLE public.guest_ai_sessions (token_hash text PRIMARY KEY CHECK (length(token_hash) = 64), expires_at timestamptz NOT NULL);
GRANT ALL ON public.guest_ai_sessions TO service_role;
REVOKE ALL ON public.guest_ai_sessions FROM PUBLIC, anon, authenticated;
ALTER TABLE public.guest_ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.guest_ai_usage (scope text NOT NULL, day date NOT NULL DEFAULT CURRENT_DATE, requests integer NOT NULL DEFAULT 0, PRIMARY KEY(scope, day));
GRANT ALL ON public.guest_ai_usage TO service_role;
REVOKE ALL ON public.guest_ai_usage FROM PUBLIC, anon, authenticated;
ALTER TABLE public.guest_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_guest_ai(p_token_hash text, p_network_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.guest_ai_sessions WHERE token_hash = p_token_hash AND expires_at > now()) THEN RETURN false; END IF;
 IF length(p_network_hash) <> 64 THEN RETURN false; END IF;
 INSERT INTO public.guest_ai_usage(scope, day, requests) VALUES ('global', CURRENT_DATE, 0) ON CONFLICT DO NOTHING;
 UPDATE public.guest_ai_usage SET requests = requests + 1 WHERE scope = 'global' AND day = CURRENT_DATE AND requests < 500 RETURNING requests INTO n;
 IF n IS NULL THEN RETURN false; END IF;
 INSERT INTO public.guest_ai_usage(scope, day, requests) VALUES (p_network_hash, CURRENT_DATE, 0) ON CONFLICT DO NOTHING;
 UPDATE public.guest_ai_usage SET requests = requests + 1 WHERE scope = p_network_hash AND day = CURRENT_DATE AND requests < 20 RETURNING requests INTO n;
 IF n IS NULL THEN
  UPDATE public.guest_ai_usage SET requests = requests - 1 WHERE scope = 'global' AND day = CURRENT_DATE;
  RETURN false;
 END IF;
 DELETE FROM public.guest_ai_sessions WHERE expires_at < now();
 DELETE FROM public.guest_ai_usage WHERE day < CURRENT_DATE - 2;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_guest_ai(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_guest_ai(text, text) TO service_role;