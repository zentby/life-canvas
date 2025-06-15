
import React from "react";
import { Tables } from "@/integrations/supabase/types";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDraggable } from "./useDraggable";

type Photo = Tables<"photos">;

interface PhotoTileProps {
  photo: Photo;
  publicUrl: string;
  posRecord: { x: number; y: number } | undefined;
  position: { top: number; left: number; rotation: number; scale: number; z: number };
  zIndex: number;
  zTop: boolean;
  onDragEnd: (xy: { x: number; y: number }) => void;
  bringPhotoToTop: () => void;
  onDelete: () => void;
}

const PHOTO_SIZE = 192;

const PhotoTile: React.FC<PhotoTileProps> = ({
  photo,
  publicUrl,
  posRecord,
  position,
  zIndex,
  zTop,
  onDragEnd,
  bringPhotoToTop,
  onDelete,
}) => {
  const initial = posRecord
    ? { x: posRecord.x, y: posRecord.y }
    : { x: position.left, y: position.top };

  const [pos, dragHandlers] = useDraggable(initial, {
    onDragEnd,
  });

  return (
    <div
      className="absolute group"
      style={{
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
        zIndex,
        transition: "transform 0.3s cubic-bezier(.47,1.64,.41,.8), box-shadow 0.2s, z-index 0s",
        boxShadow: zTop ? "0px 6px 24px 0 rgba(0,0,0,0.18)" : undefined,
        cursor: "grab",
        touchAction: "none"
      }}
      onClick={bringPhotoToTop}
      {...dragHandlers}
    >
      <div className={`relative ${zTop ? "ring-2 ring-white/90" : ""}`}>
        <img
          src={publicUrl}
          alt={photo.file_name}
          className="w-48 h-48 object-cover rounded-lg shadow-lg border-4 border-white group-hover:shadow-xl transition-all duration-300 select-none pointer-events-auto"
          draggable={false}
          style={{
            userSelect: "none",
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
          }}
        />
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
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
};

export default PhotoTile;
