
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tables } from '@/integrations/supabase/types';

interface FriendsListProps {
  friendProfiles: {
    friendRequest: Tables<'friend_requests'>;
    profile: { id: string; email: string | null };
  }[];
  shares: Record<string, Tables<'wall_shares'>>;
  updateShare: (friendId: string, shared: boolean) => Promise<boolean | undefined>;
  wallShareLoading: boolean;
  loading: boolean;
  friendProfilesLoading: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({
  friendProfiles,
  shares,
  updateShare,
  wallShareLoading,
  loading,
  friendProfilesLoading,
}) => {
  return (
    <div>
      <h3 className="font-semibold text-sm mb-1">Your Friends:</h3>
      <ul className="flex flex-col gap-1">
        {friendProfiles.length === 0 && <li className="text-xs text-gray-500">You have no friends yet.</li>}
        {friendProfiles.map((f) => {
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
  );
};

export default FriendsList;
