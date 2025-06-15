import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDraggable } from "./useDraggable";

type Photo = Tables<'photos'>;

interface PhotoWallProps {
  refreshTrigger: number;
}

type PlacedPhoto = Photo & {
  position: { top: number, left: number, rotation: number, scale: number, z: number }
};

const PHOTO_SIZE = 192; // 48*4 px; match w-48/h-48

const getRandomRotation = () => Math.random() * 30 - 15; // -15 to +15 deg
const getRandomScale = () => Math.random() * 0.4 + 0.8; // 0.8 - 1.2

const PhotoWall = ({ refreshTrigger }: PhotoWallProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<PlacedPhoto[]>([]);
  const [zstack, setZstack] = useState<string[]>([]);
  const [manualPos, setManualPos] = useState<Record<string, { x: number; y: number }>>({});
  const wallRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

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
      style={{ touchAction: 'manipulation' }}
    >
      {placed.map((photo, idx) => {
        // Responsive Z-index via zstack
        const zIndex = 20 + zstack.indexOf(photo.id);

        // Drag state per photo: either from manualPos or default (random placed pos)
        const initial = manualPos[photo.id]
          ? { x: manualPos[photo.id].x, y: manualPos[photo.id].y }
          : { x: photo.position.left, y: photo.position.top };

        const [pos, dragHandlers] = useDraggable(initial, {
          onDragEnd: (final) => {
            setManualPos((curr) => ({
              ...curr,
              [photo.id]: final
            }));
            bringPhotoToTop(photo.id);
          }
        });

        return (
          <div
            key={photo.id}
            className="absolute group"
            style={{
              top: `${pos.y}px`,
              left: `${pos.x}px`,
              transform: `rotate(${photo.position.rotation}deg) scale(${photo.position.scale})`,
              zIndex,
              transition: 'transform 0.3s cubic-bezier(.47,1.64,.41,.8), box-shadow 0.2s, z-index 0s',
              boxShadow: zstack[zstack.length - 1] === photo.id ? "0px 6px 24px 0 rgba(0,0,0,0.18)" : undefined,
              cursor: 'grab',
              touchAction: "none"
            }}
            onClick={() => bringPhotoToTop(photo.id)}
            {...dragHandlers}
          >
            <div className={`relative ${zstack[zstack.length-1] === photo.id ? 'ring-2 ring-white/90' : ''}`}>
              <img
                src={photoUrls[photo.id]}
                alt={photo.file_name}
                className="w-48 h-48 object-cover rounded-lg shadow-lg border-4 border-white group-hover:shadow-xl transition-all duration-300 select-none pointer-events-auto"
                draggable={false}
                style={{
                  userSelect: 'none',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                }}
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePhoto(photo);
                }}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 p-0"
                title="Delete photo"
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
