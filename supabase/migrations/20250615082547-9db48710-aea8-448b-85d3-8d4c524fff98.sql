
-- Create a table to track photo wall sharing preferences!
CREATE TABLE public.wall_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared boolean NOT NULL default false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.wall_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Only the owner of a wall can manage sharing for their own wall
CREATE POLICY "Owner can manage their wall shares"
  ON public.wall_shares
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Both owner and friend can read (to know if they have access)
CREATE POLICY "Owner and friend can read wall shares"
  ON public.wall_shares
  FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = friend_id);

-- Add trigger to update updated_at on update
CREATE OR REPLACE FUNCTION public.wall_shares_updated_at_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.wall_shares
FOR EACH ROW EXECUTE FUNCTION public.wall_shares_updated_at_fn();
