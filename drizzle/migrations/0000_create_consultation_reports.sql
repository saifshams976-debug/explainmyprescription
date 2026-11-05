CREATE TABLE public.consultation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Consultation report',
  report jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.consultation_reports TO authenticated;
GRANT ALL ON public.consultation_reports TO service_role;

ALTER TABLE public.consultation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consultation reports"
ON public.consultation_reports FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consultation reports"
ON public.consultation_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consultation reports"
ON public.consultation_reports FOR DELETE TO authenticated
USING (auth.uid() = user_id);