import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDraggable } from "./useDraggable";
import PhotoTile from "./PhotoTile";

type Photo = Tables<'photos'>;

interface PhotoWallProps {
  refreshTrigger?: number;
  wallOwnerId?: string; // Add support for displaying another user's wall
  readOnly?: boolean;
}

type PlacedPhoto = Photo & {
  position: { top: number, left: number, rotation: number, scale: number, z: number }
};

const PHOTO_SIZE = 192; // 48*4 px; match w-48/h-48

const getRandomRotation = () => Math.random() * 30 - 15; // -15 to +15 deg
const getRandomScale = () => Math.random() * 0.4 + 0.8; // 0.8 - 1.2

const PhotoWall = ({ refreshTrigger, wallOwnerId, readOnly }: PhotoWallProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<PlacedPhoto[]>([]);
  const [zstack, setZstack] = useState<string[]>([]);
  const [manualPos, setManualPos] = useState<Record<string, { x: number; y: number }>>({});
  const wallRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const loadPhotos = async () => {
    try {
      let userId = wallOwnerId;
      if (!userId) {
        // If not specified, show signed-in user (my own wall)
        const { data: user } = await supabase.auth.getUser();
        userId = user?.user?.id;
      }
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
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

  // Improved algorithm: try to randomly place images on the wall, avoiding overlaps where possible
  useEffect(() => {
    if (!photos.length) return setPlaced([]);
    function getWallSize() {
      // fallback values if ref is not ready
      return {
        width: wallRef.current?.offsetWidth || window.innerWidth,
        height: wallRef.current?.offsetHeight || window.innerHeight - 130 // account for header
      };
    }
    const { width, height } = getWallSize();
    const margin = 14;
    const photoW = PHOTO_SIZE;
    const photoH = PHOTO_SIZE;
    let positions: { top: number, left: number, rotation: number, scale: number, z: number }[] = [];
    let tries = 0;
    photos.forEach((photo, idx) => {
      let placed = false;
      while (!placed && tries < 1000) {
        // Boundaries: 5%-95%
        const scale = getRandomScale();
        const w = photoW * scale;
        const h = photoH * scale;
        const top = Math.random() * (height - h - margin*2) + margin;
        const left = Math.random() * (width - w - margin*2) + margin;
        // Random rotation
        const rotation = getRandomRotation();

        // Check overlap
        const overlaps = positions.some(pos => {
          const posW = photoW * pos.scale;
          const posH = photoH * pos.scale;
          return !(left + w < pos.left - margin || left > pos.left + posW + margin ||
                   top + h < pos.top - margin || top > pos.top + posH + margin);
        });
        if (!overlaps) {
          positions.push({ top, left, rotation, scale, z: idx+1 });
          placed = true;
        }
        tries++;
        // Fallback: just push if we try too much (too crowded)
        if (tries > 100 && !placed) {
          positions.push({ 
            top: Math.random() * (height - h - margin) + margin, 
            left: Math.random() * (width - w - margin) + margin, 
            rotation, 
            scale, z: idx+1 });
          placed = true;
        }
      }
    });
    // fallback to prior stack order if available
    let curZstack = photos.map(photo=>photo.id);
    setZstack(curZstack);
    setPlaced(photos.map((photo, i) => ({
      ...photo,
      position: positions[i] || { top: 0, left: 0, rotation: 0, scale: 1, z: i+1 }
    })));
  // eslint-disable-next-line
  }, [photos, refreshTrigger]);

  const deletePhoto = async (photo: Photo) => {
    if (readOnly) return; // no-op in readOnly
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

  // Z-index management: bring image to top on click or drag
  const bringPhotoToTop = (photoId: string) => {
    setZstack(prev => [
      ...prev.filter(id => id !== photoId),
      photoId
    ]);
  };

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line
  }, [refreshTrigger]);

  if (!placed.length) {
    return (
      <div className="text-center text-white/70 py-20">
        <p className="text-xl">No photos yet!</p>
        <p className="text-sm mt-2">Upload your first photo to get started.</p>
      </div>
    );
  }

  return (
    <div
      ref={wallRef}
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ touchAction: "manipulation" }}
    >
      {placed.map((photo, idx) => {
        // Responsive Z-index via zstack
        const zIndex = 20 + zstack.indexOf(photo.id);
        const zTop = zstack[zstack.length - 1] === photo.id;

        return (
          <PhotoTile
            key={photo.id}
            photo={photo}
            publicUrl={photoUrls[photo.id]}
            posRecord={manualPos[photo.id]}
            position={photo.position}
            zIndex={zIndex}
            zTop={zTop}
            onDragEnd={(final) => {
              if (readOnly) return; // no drag in readOnly mode
              setManualPos((curr) => ({
                ...curr,
                [photo.id]: final,
              }));
              bringPhotoToTop(photo.id);
            }}
            bringPhotoToTop={() => {
              if (readOnly) return;
              bringPhotoToTop(photo.id);
            }}
            onDelete={() => deletePhoto(photo)}
          />
        );
      })}
      {/* If readOnly, overlay a banner */}
      {readOnly && (
        <div className="absolute top-4 right-4 bg-white/90 px-4 py-2 rounded shadow-lg text-gray-700 font-medium z-50">
          Read-only view
        </div>
      )}
    </div>
  );
};

export default PhotoWall;

// NOTE: This file is getting long, please consider refactoring!
