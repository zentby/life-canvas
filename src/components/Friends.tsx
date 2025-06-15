
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tables } from "@/integrations/supabase/types";

type FriendRequest = Tables<"friend_requests">;
type Profile = Tables<"profiles">;

const Friends: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, string | null>>({}); // user_id: email

  // All relevant user ids to fetch from profiles table
  const getRelevantUserIds = (
    requests: FriendRequest[],
    incoming: FriendRequest[],
    friends: FriendRequest[]
  ): string[] => {
    const ids = new Set<string>();
    [...requests, ...incoming, ...friends].forEach(fr => {
      if (fr.sender_id) ids.add(fr.sender_id);
    });
    return Array.from(ids);
  };

  // Map sender_id to email, fallback to sender_id if not found
  const resolveEmail = (userId: string) => {
    return profiles[userId] || userId;
  };

  // Load sent requests, incoming requests, and accepted friends
  const fetchFriendRequests = async () => {
    setLoading(true);

    // Get logged in user's info
    let user = null;
    let myEmail = null;
    if (supabase.auth.getUser) {
      const auth = await supabase.auth.getUser();
      user = auth?.data.user;
      if (user?.id) {
        const res = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();
        myEmail = res?.data?.email;
      }
    }

    // Fetch all friend_requests relevant to user: sent, received, accepted
    // Outgoing/Pending requests: sent by me and not accepted
    // Incoming requests: sent to me (by email) and not accepted
    // Friends: either sent by me or received by me, and accepted

    const { data: allRequests, error } = await supabase
      .from("friend_requests")
      .select("*");

    if (error) {
      toast({ title: "Error loading friend requests", description: error.message });
      setLoading(false);
      return;
    }

    const outgoing = (allRequests || []).filter(
      (r) => !r.accepted && r.sender_id === user?.id
    );
    const inc = (allRequests || []).filter(
      (r) =>
        !r.accepted &&
        r.recipient_email === myEmail &&
        r.sender_id !== user?.id // exclude sent by self
    );
    const accepted = (allRequests || []).filter(
      (r) =>
        r.accepted &&
        (r.sender_id === user?.id || r.recipient_email === myEmail)
    );

    // Now collect all user ids for profiles
    const userIds = getRelevantUserIds(outgoing, inc, accepted);

    let emails: Record<string, string | null> = {};
    if (userIds.length > 0) {
      // Fetch all profiles for these user IDs
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id,email")
        .in("id", userIds);

      if (profilesData) {
        profilesData.forEach((p) => {
          emails[p.id] = p.email;
        });
      }
    }

    setRequests(outgoing);
    setIncoming(inc);
    setFriends(accepted);
    setProfiles(emails);
    setLoading(false);
  };

  useEffect(() => {
    fetchFriendRequests();
    // eslint-disable-next-line
  }, []);

  // Send a friend request
  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Grab user id for sender
    let user = null;
    if (supabase.auth.getUser) {
      const auth = await supabase.auth.getUser();
      user = auth?.data.user;
    }
    if (!user || !user.id) {
      toast({ title: "Error", description: "You must be signed in." });
      setLoading(false);
      return;
    }

    // Can't send to self
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.email === email) {
      toast({ title: "Error", description: "You can't add yourself!" });
      setLoading(false);
      return;
    }

    // Create request
    const { error } = await supabase.from("friend_requests").insert([
      {
        sender_id: user.id,
        recipient_email: email,
      },
    ]);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Request sent!", description: `Request sent to ${email}` });
      setEmail("");
      fetchFriendRequests();
    }
    setLoading(false);
  };

  // Accept a friend request
  const acceptRequest = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("friend_requests")
      .update({ accepted: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Couldn't accept request", description: error.message });
    } else {
      toast({ title: "Friend added!" });
      fetchFriendRequests();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/80 rounded-xl px-6 py-4 shadow-lg max-w-lg w-full mt-4 mx-auto">
      <h2 className="text-xl font-semibold mb-3 text-center">Friends</h2>
      <form onSubmit={sendRequest} className="flex gap-2 mb-4">
        <Input
          placeholder="Enter user's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          type="email"
          required
        />
        <Button type="submit" disabled={loading}>
          Add Friend
        </Button>
      </form>
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-1">Incoming Requests:</h3>
        <ul className="flex flex-col gap-1">
          {incoming.length === 0 && <li className="text-xs text-gray-500">No incoming requests.</li>}
          {incoming.map((req) => (
            <li key={req.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
              <span className="text-gray-800">
                {resolveEmail(req.sender_id)}
              </span>
              <Button size="sm" onClick={() => acceptRequest(req.id)} disabled={loading}>
                Accept
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-1">Outgoing Requests:</h3>
        <ul className="flex flex-col gap-1">
          {requests.length === 0 && <li className="text-xs text-gray-500">No outgoing requests.</li>}
          {requests.map((req) => (
            <li key={req.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
              <span className="text-gray-800">{req.recipient_email}</span>
              <span className="text-xs text-gray-400">Pending</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1">Your Friends:</h3>
        <ul className="flex flex-col gap-1">
          {friends.length === 0 && <li className="text-xs text-gray-500">You have no friends yet.</li>}
          {friends.map((f) => (
            <li key={f.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
              <span className="text-gray-800">
                {resolveEmail(f.sender_id)} ↔ {f.recipient_email}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Friends;
