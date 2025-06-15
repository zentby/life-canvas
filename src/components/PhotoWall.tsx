
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Photo = Tables<'photos'>;

interface PhotoWallProps {
  refreshTrigger: number;
}

const PhotoWall = ({ refreshTrigger }: PhotoWallProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const getRandomPosition = () => ({
    top: Math.random() * 70 + 5, // 5% to 75% from top
    left: Math.random() * 70 + 5, // 5% to 75% from left
    rotation: Math.random() * 30 - 15, // -15 to 15 degrees
    scale: Math.random() * 0.4 + 0.8, // 0.8 to 1.2 scale
  });

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
      
      // Generate random positions for each photo
      const urls: Record<string, string> = {};
      for (const photo of data || []) {
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(photo.file_path);
        urls[photo.id] = publicUrl;
      }
      setPhotoUrls(urls);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load photos",
      });
    }
  };

  const deletePhoto = async (photo: Photo) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Photo deleted successfully!",
      });

      loadPhotos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [refreshTrigger]);

  if (photos.length === 0) {
    return (
      <div className="text-center text-white/70 py-20">
        <p className="text-xl">No photos yet!</p>
        <p className="text-sm mt-2">Upload your first photo to get started</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {photos.map((photo) => {
        const position = getRandomPosition();
        return (
          <div
            key={photo.id}
            className="absolute group"
            style={{
              top: `${position.top}%`,
              left: `${position.left}%`,
              transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
              transition: 'transform 0.3s ease',
            }}
          >
            <div className="relative">
              <img
                src={photoUrls[photo.id]}
                alt={photo.file_name}
                className="w-48 h-48 object-cover rounded-lg shadow-lg border-4 border-white group-hover:shadow-xl transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
                }}
              />
              <Button
                onClick={() => deletePhoto(photo)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 p-0"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PhotoWall;
