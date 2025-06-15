
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

/**
 * Returns a stable friend list where each entry is:
 * {
 *   friendRequest: Row from friend_requests table (accepted)
 *   profile: { id, email } for the friend
 * }
 * The `profile.id` is the friend user's uuid, never the current user's.
 */
export function useFriendListWithProfiles(myUserId: string | null, myEmail: string | null) {
  const [friends, setFriends] = useState<
    {
      friendRequest: Tables<"friend_requests">;
      profile: { id: string; email: string | null };
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFriends() {
      if (!myUserId || !myEmail) {
        setFriends([]);
        return;
      }
      setLoading(true);

      // Fetch accepted friend requests involving me
      const { data: allRequests, error } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("accepted", true);
      if (error) {
        setLoading(false);
        return;
      }
      // Find all other party IDs or recipient_emails
      const friendItems: {
        friendRequest: Tables<"friend_requests">;
        profile: { id: string; email: string | null };
      }[] = [];
      for (const fr of allRequests || []) {
        if (fr.sender_id === myUserId) {
          // Recipient is the friend, lookup id by email from profiles
          if (fr.recipient_email) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("id,email")
              .eq("email", fr.recipient_email)
              .maybeSingle();
            if (prof && prof.id) {
              friendItems.push({ friendRequest: fr, profile: { id: prof.id, email: prof.email }});
            }
          }
        } else if (fr.recipient_email === myEmail) {
          // Sender is the friend
          if (fr.sender_id) {
            // Also fetch their email if possible
            const { data: prof } = await supabase
              .from("profiles")
              .select("id,email")
              .eq("id", fr.sender_id)
              .maybeSingle();
            friendItems.push({
              friendRequest: fr,
              profile: { id: fr.sender_id, email: prof?.email ?? null }
            });
          }
        }
      }
      setFriends(friendItems);
      setLoading(false);
    }
    fetchFriends();
  }, [myUserId, myEmail]);

  return { friends, loading };
}
