
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PhotoWall from "@/components/PhotoWall";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * This page displays a friend's PhotoWall if the owner shared it.
 * If access denied, it shows a message and returns to /friends.
 * Route: /wall/:friendId
 */
const FriendWall: React.FC = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [friendEmail, setFriendEmail] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we (the logged-in user) can view friend's wall
    async function checkAccess() {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id || !friendId) return setHasAccess(false);

      // Get wall_share record for this relationship where friend is owner, we are friend
      const { data, error } = await supabase
        .from("wall_shares")
        .select("*")
        .eq("owner_id", friendId)
        .eq("friend_id", user.user.id)
        .maybeSingle();
      if (error || !data || !data.shared) {
        setHasAccess(false);
        return;
      }
      setHasAccess(true);

      // Find owner's email
      const { data: prof } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", friendId)
        .maybeSingle();
      setFriendEmail(prof?.email ?? null);
    }
    checkAccess();
  }, [friendId]);

  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="max-w-sm bg-white/80 p-6 rounded-xl shadow-lg">
          <h2 className="font-semibold text-lg mb-3">Access Denied</h2>
          <p className="mb-5">This user has not shared their wall with you.</p>
          <Button asChild>
            <Link to="/friends">
              <ArrowLeft size={16} className="inline mr-2" />
              Back to Friends
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-white/90 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="absolute top-6 left-6">
        <Button asChild variant="outline" className="bg-white/60 backdrop-blur hover:bg-white/80 text-gray-800 border-white/30 px-3 py-2 shadow">
          <Link to="/friends">
            <ArrowLeft className="mr-2" size={18} />
            Friends
          </Link>
        </Button>
      </div>
      <div className="pt-24 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-white drop-shadow text-center mb-6">
          {friendEmail ? `${friendEmail}'s Wall` : "Friend's Wall"}
        </h2>
        <PhotoWall wallOwnerId={friendId!} readOnly />
      </div>
    </div>
  );
};

export default FriendWall;
