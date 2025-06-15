import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useWallShares } from "@/hooks/useWallShares";
import { useFriendListWithProfiles } from "@/hooks/useFriendListWithProfiles";

type FriendRequest = Tables<"friend_requests">;

const Friends: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);

  // Fetch sent/received/accepted requests
  const fetchFriendRequests = async () => {
    setLoading(true);

    // Get logged in user
    let user = null;
    let _myEmail = null;
    let _myUserId = null;
    if (supabase.auth.getUser) {
      const auth = await supabase.auth.getUser();
      user = auth?.data.user;
      _myUserId = user?.id;
      setMyUserId(_myUserId ?? null);
      if (user?.id) {
        const res = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();
        _myEmail = res?.data?.email ?? null;
        setMyEmail(_myEmail);
      }
    }

    // Catch not signed in
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    // Fetch all friend_requests
    const { data: allRequests, error } = await supabase
      .from("friend_requests")
      .select("*");

    if (error) {
      toast({ title: "Error loading friend requests", description: error.message });
      setLoading(false);
      return;
    }

    // Outgoing: you sent requests, not yet accepted
    const outgoing = (allRequests || []).filter(
      (r) => !r.accepted && r.sender_id === user?.id
    );
    // Incoming: sent to you (by others) and not yet accepted
    const inc = (allRequests || []).filter(
      (r) =>
        !r.accepted &&
        r.recipient_email === _myEmail &&
        r.sender_id !== user?.id
    );
    // Accepted friends: fill both sender_id and recipient_email matches
    const accepted = (allRequests || []).filter(
      (r) =>
        r.accepted &&
        (r.sender_id === user?.id || r.recipient_email === _myEmail)
    );

    setRequests(outgoing);
    setIncoming(inc);
    setFriends(accepted);

    // Collect friend UUIDs for wall share toggles
    if (_myUserId && _myEmail) {
      const ids = accepted
        .map((f) =>
          f.sender_id === _myUserId
            ? null // friend is recipient, must fetch their id from recipient_email via profiles
            : f.sender_id
        )
        .filter(Boolean) as string[];
      // Add lookup for those where I'm sender
      const recipientsToFetch = accepted
        .filter((f) => f.sender_id === _myUserId && f.recipient_email)
        .map((f) => f.recipient_email);

      // Get their uuids via profiles
      let emailToIdMap: Record<string, string> = {};
      if (recipientsToFetch.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,email")
          .in("email", recipientsToFetch);
        if (profiles) {
          for (const prof of profiles) {
            emailToIdMap[prof.email] = prof.id;
          }
        }
      }
      const allFriendIds = [
        ...ids,
        ...recipientsToFetch.map((email) => emailToIdMap[email]).filter(Boolean),
      ];
      setFriendIds(allFriendIds);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchFriendRequests();
    // eslint-disable-next-line
  }, []);

  // New, more robust friend+profile list for wall shares
  const { friends: friendProfiles, loading: friendProfilesLoading } = useFriendListWithProfiles(myUserId, myEmail);
  const friendIds = friendProfiles.map((f) => f.profile.id);

  // Wall Shares
  const { shares, loading: wallShareLoading, fetchShares, updateShare } = useWallShares(
    myUserId,
    friendIds
  );
  useEffect(() => {
    fetchShares();
    // eslint-disable-next-line
  }, [friendIds, myUserId]);

  // Send a friend request -- include sender_email
  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Grab user id/email for sender
    let user = null;
    let currEmail = null;
    if (supabase.auth.getUser) {
      const auth = await supabase.auth.getUser();
      user = auth?.data.user;
      if (user?.id) {
        const res = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .maybeSingle();
        currEmail = res?.data?.email ?? null;
      }
    }
    if (!user || !user.id) {
      toast({ title: "Error", description: "You must be signed in." });
      setLoading(false);
      return;
    }

    // Can't send to self
    if (currEmail === email) {
      toast({ title: "Error", description: "You can't add yourself!" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("friend_requests").insert([
      {
        sender_id: user.id,
        sender_email: currEmail,
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
      {/* Add Friend Form */}
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
      {/* Incoming Requests */}
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-1">Incoming Requests:</h3>
        <ul className="flex flex-col gap-1">
          {incoming.length === 0 && <li className="text-xs text-gray-500">No incoming requests.</li>}
          {incoming.map((req) => (
            <li key={req.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
              {/* Always show sender's email */}
              <span className="text-gray-800">{req.sender_email || req.sender_id}</span>
              <Button size="sm" onClick={() => acceptRequest(req.id)} disabled={loading}>
                Accept
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {/* Outgoing Requests */}
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-1">Outgoing Requests:</h3>
        <ul className="flex flex-col gap-1">
          {requests.length === 0 && <li className="text-xs text-gray-500">No outgoing requests.</li>}
          {requests.map((req) => (
            <li key={req.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
              {/* Outgoing always shows recipient email */}
              <span className="text-gray-800">{req.recipient_email}</span>
              <span className="text-xs text-gray-400">Pending</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Friends */}
      <div>
        <h3 className="font-semibold text-sm mb-1">Your Friends:</h3>
        <ul className="flex flex-col gap-1">
          {friendProfiles.length === 0 && <li className="text-xs text-gray-500">You have no friends yet.</li>}
          {friendProfiles.map((f) => {
            // f.profile.id is always the friend's user id
            // f.profile.email is human-readable label
            const friendId = f.profile.id;
            const friendLabel = f.profile.email || friendId;
            console.log('[DEBUG] Wall list: friendId', friendId, 'friendLabel', friendLabel, 'shareObj', shares[friendId]);

            return (
              <li key={f.friendRequest.id} className="flex flex-col md:flex-row md:items-center justify-between border rounded px-2 py-1 bg-white mb-1 gap-1 md:gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-800">{friendLabel}</span>
                  {friendId && (
                    <>
                      <Switch
                        checked={!!shares[friendId]?.shared}
                        onCheckedChange={(value) => {
                          updateShare(friendId, value);
                        }}
                        disabled={wallShareLoading || loading || friendProfilesLoading}
                        className="ml-2"
                        aria-label={`Share your wall with ${friendLabel}`}
                      />
                      <span className="text-xs text-gray-500">
                        Share wall
                      </span>
                    </>
                  )}
                </div>
                {friendId && shares[friendId]?.shared && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="bg-white/80 border-gray-200 shadow"
                  >
                    <Link to={`/wall/${friendId}`}>
                      Visit Wall
                    </Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Friends;

// NOTE: This file is getting very long. Please consider refactoring it into smaller files!
