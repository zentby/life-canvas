
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddFriendFormProps {
  email: string;
  setEmail: (email: string) => void;
  sendRequest: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

const AddFriendForm: React.FC<AddFriendFormProps> = ({ email, setEmail, sendRequest, loading }) => {
  return (
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
  );
};

export default AddFriendForm;
