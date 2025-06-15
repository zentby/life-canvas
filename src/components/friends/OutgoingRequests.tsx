
import React from 'react';
import { Tables } from '@/integrations/supabase/types';

type FriendRequest = Tables<'friend_requests'>;

interface OutgoingRequestsProps {
  requests: FriendRequest[];
}

const OutgoingRequests: React.FC<OutgoingRequestsProps> = ({ requests }) => {
  return (
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
  );
};

export default OutgoingRequests;
