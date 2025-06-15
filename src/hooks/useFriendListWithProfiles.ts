
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a stable friend list where each entry is a profile:
 * {
 *   id: string (friend's user uuid)
 *   email: string | null
 * }
 * The `id` is the friend user's uuid, never the current user's.
 */
export function useFriendListWithProfiles(myUserId: string | null) {
  const [friends, setFriends] = useState<{ id: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFriends() {
      if (!myUserId) {
        setFriends([]);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase.rpc('get_friend_profiles', {
        my_user_id: myUserId,
      });

      if (error) {
        console.error("Error fetching friend profiles:", error.message);
        setFriends([]);
      } else if (data) {
        setFriends(data.map(p => ({ id: p.id, email: p.email ?? null })));
      }
      
      setLoading(false);
    }
    fetchFriends();
  }, [myUserId]);

  return { friends, loading };
}
