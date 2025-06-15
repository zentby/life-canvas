
import React, { useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoWall from '@/components/PhotoWall';
import BackgroundSelector from '@/components/BackgroundSelector';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [background, setBackground] = useState('from-purple-400 via-pink-500 to-red-500');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePhotoUploaded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackgroundChange = (gradient: string) => {
    setBackground(gradient);
  };

  const shufflePhotos = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${background} transition-all duration-1000`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">My Photo Wall</h1>
          <div className="flex gap-3">
            <BackgroundSelector onBackgroundChange={handleBackgroundChange} />
            <Button
              onClick={shufflePhotos}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
            >
              <RefreshCw size={16} className="mr-2" />
              Shuffle
            </Button>
            <Button
              onClick={signOut}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="absolute top-20 left-6 z-10 pt-4">
        <PhotoUpload onPhotoUploaded={handlePhotoUploaded} />
      </div>

      {/* Photo Wall */}
      <div className="pt-32">
        <PhotoWall refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Index;
