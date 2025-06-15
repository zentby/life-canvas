
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

/**
 * Custom React hook to manage wall sharing preferences for user's friends.
 * Returns:
 *  - shares: Record<friendId, WallShare>
 *  - loading: boolean
 *  - updateShare: (friendId: string, share: boolean) => Promise<void>
 */
export function useWallShares(ownerId: string | null, friendIds: string[]) {
  const [shares, setShares] = useState<Record<string, Tables<"wall_shares">>>({});
  const [loading, setLoading] = useState(false);

  const fetchShares = useCallback(async () => {
    if (!ownerId || !friendIds.length) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("wall_shares")
      .select("*")
      .eq("owner_id", ownerId)
      .in("friend_id", friendIds);
    if (!error && data) {
      const map: Record<string, Tables<"wall_shares">> = {};
      for (const row of data) {
        map[row.friend_id] = row;
      }
      setShares(map);
    }
    setLoading(false);
  }, [ownerId, friendIds]);

  const updateShare = useCallback(
    async (friendId: string, shared: boolean) => {
      setLoading(true);
      // Upsert (insert if doesn't exist, update if does)
      const { data, error } = await supabase
        .from("wall_shares")
        .upsert(
          {
            owner_id: ownerId,
            friend_id: friendId,
            shared,
          },
          { onConflict: "owner_id,friend_id" }
        )
        .select()
        .maybeSingle();
      if (!error && data) {
        setShares((s) => ({ ...s, [friendId]: data }));
      }
      setLoading(false);
      return !error;
    },
    [ownerId]
  );

  return { shares, loading, fetchShares, updateShare };
}
