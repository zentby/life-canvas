
-- 1. Create the friend_requests table
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Sender can insert and see their sent requests
CREATE POLICY "Sender can manage their own friend requests"
  ON public.friend_requests
  FOR ALL
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- 4. Policy: Recipient can view friend requests sent to them OR sent by them
CREATE POLICY "Recipient can view friend requests sent to them"
  ON public.friend_requests
  FOR SELECT USING (
    (SELECT profiles.email FROM public.profiles WHERE profiles.id = auth.uid()) = recipient_email
    OR auth.uid() = sender_id
  );

-- 5. Policy: Recipient can accept friend requests sent to them
CREATE POLICY "Recipient can accept friend requests sent to them"
  ON public.friend_requests
  FOR UPDATE USING (
    (SELECT profiles.email FROM public.profiles WHERE profiles.id = auth.uid()) = recipient_email
  );
