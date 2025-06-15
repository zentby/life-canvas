
-- 1. Add sender_email column to friend_requests
ALTER TABLE public.friend_requests ADD COLUMN sender_email TEXT;

-- 2. Backfill: for now, just leave it NULL for existing records.

-- 3. Update RLS so sender can set sender_email, and sender/recipient can view it as before.

-- Update policy: Sender can manage their own friend requests (already allows all actions)
DROP POLICY IF EXISTS "Sender can manage their own friend requests" ON public.friend_requests;
CREATE POLICY "Sender can manage their own friend requests"
  ON public.friend_requests
  FOR ALL
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Update policy: Recipient can view friend requests sent to them OR sent by them
DROP POLICY IF EXISTS "Recipient can view friend requests sent to them" ON public.friend_requests;
CREATE POLICY "Recipient can view friend requests sent to them"
  ON public.friend_requests
  FOR SELECT USING (
    (SELECT profiles.email FROM public.profiles WHERE profiles.id = auth.uid()) = recipient_email
    OR auth.uid() = sender_id
  );

-- Policy for recipient to accept requests (unchanged)
DROP POLICY IF EXISTS "Recipient can accept friend requests sent to them" ON public.friend_requests;
CREATE POLICY "Recipient can accept friend requests sent to them"
  ON public.friend_requests
  FOR UPDATE USING (
    (SELECT profiles.email FROM public.profiles WHERE profiles.id = auth.uid()) = recipient_email
  );
