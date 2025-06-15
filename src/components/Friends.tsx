import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useWallShares } from "@/hooks/useWallShares";
import { useFriendListWithProfiles } from "@/hooks/useFriendListWithProfiles";
import AddFriendForm from "./friends/AddFriendForm";
import IncomingRequests from "./friends/IncomingRequests";
import OutgoingRequests from "./friends/OutgoingRequests";
import FriendsList from "./friends/FriendsList";

type FriendRequest = Tables<"friend_requests">;

const Friends: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);

  // Fetch sent/received requests
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

    setRequests(outgoing);
    setIncoming(inc);

    setLoading(false);
  };

  useEffect(() => {
    fetchFriendRequests();
    // eslint-disable-next-line
  }, []);

  // New, more robust friend+profile list for wall shares
  const { friends: friendProfiles, loading: friendProfilesLoading } = useFriendListWithProfiles(myUserId);
  const friendIds = friendProfiles.map((f) => f.id);

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
      <AddFriendForm email={email} setEmail={setEmail} sendRequest={sendRequest} loading={loading} />
      <IncomingRequests incoming={incoming} acceptRequest={acceptRequest} loading={loading} />
      <OutgoingRequests requests={requests} />
      <FriendsList
        friendProfiles={friendProfiles}
        shares={shares}
        updateShare={updateShare}
        wallShareLoading={wallShareLoading}
        loading={loading}
        friendProfilesLoading={friendProfilesLoading}
      />
    </div>
  );
};

export default Friends;
