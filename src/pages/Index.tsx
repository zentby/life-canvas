import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw, Menu, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoWall from '@/components/PhotoWall';
import BackgroundSelector from '@/components/BackgroundSelector';
import Friends from '@/components/Friends';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [background, setBackground] = useState('from-purple-400 via-pink-500 to-red-500');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load background from localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('lc_bg_gradient');
    if (savedBg) setBackground(savedBg);
  }, []);

  const handlePhotoUploaded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackgroundChange = (gradient: string) => {
    setBackground(gradient);
    localStorage.setItem('lc_bg_gradient', gradient);
  };

  const shufflePhotos = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-white text-xl font-semibold">Loading Life Canvas...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${background} transition-all duration-1000`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white drop-shadow">Life Canvas</h1>
          {/* Desktop Button Actions */}
          <div className="hidden md:flex gap-3">
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
          {/* Mobile Menu Dropdown */}
          <div className="md:hidden z-30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/30 p-2 border-white/30">
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-white/95 z-50 mr-2" align="end">
                <DropdownMenuItem asChild>
                  <div>
                    <BackgroundSelector 
                      onBackgroundChange={handleBackgroundChange}
                      asDropdownItem
                    />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shufflePhotos} className="gap-2">
                  <RefreshCw size={16} />
                  Shuffle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="gap-2">
                  <LogOut size={16} />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="absolute top-20 left-6 z-10 pt-4">
        <PhotoUpload onPhotoUploaded={handlePhotoUploaded} />
      </div>

      {/* Friends Section */}
      <div className="flex justify-center pt-32">
        <Friends />
      </div>

      {/* Photo Wall */}
      <div className="pt-10">
        <PhotoWall refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Index;
