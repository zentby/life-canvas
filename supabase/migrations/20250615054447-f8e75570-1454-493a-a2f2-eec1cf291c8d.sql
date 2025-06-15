
-- 1. Create a SECURITY DEFINER function to fetch a user's friends' profile emails.
CREATE OR REPLACE FUNCTION public.get_friend_profiles(my_user_id uuid)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, p.email
  FROM public.profiles AS p
  WHERE p.id IN (
    -- Get users where there is an accepted friend request
    SELECT
      CASE
        WHEN fr.sender_id = my_user_id THEN (
          SELECT id FROM public.profiles WHERE email = fr.recipient_email
        )
        ELSE fr.sender_id
      END AS friend_id
    FROM public.friend_requests fr
    WHERE
      fr.accepted = true AND (
        fr.sender_id = my_user_id
        OR fr.recipient_email = (SELECT email FROM public.profiles WHERE id = my_user_id)
      )
  )
$$;

-- 2. Allow execution of this function to all authenticated users
GRANT EXECUTE ON FUNCTION public.get_friend_profiles(uuid) TO authenticated;
