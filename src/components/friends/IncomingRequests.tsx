
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';

type FriendRequest = Tables<'friend_requests'>;

interface IncomingRequestsProps {
  incoming: FriendRequest[];
  acceptRequest: (id: string) => Promise<void>;
  loading: boolean;
}

const IncomingRequests: React.FC<IncomingRequestsProps> = ({ incoming, acceptRequest, loading }) => {
  return (
    <div className="mb-3">
      <h3 className="font-semibold text-sm mb-1">Incoming Requests:</h3>
      <ul className="flex flex-col gap-1">
        {incoming.length === 0 && <li className="text-xs text-gray-500">No incoming requests.</li>}
        {incoming.map((req) => (
          <li key={req.id} className="flex items-center justify-between border rounded px-2 py-1 bg-white">
            <span className="text-gray-800">{req.sender_email || req.sender_id}</span>
            <Button size="sm" onClick={() => acceptRequest(req.id)} disabled={loading}>
              Accept
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IncomingRequests;
