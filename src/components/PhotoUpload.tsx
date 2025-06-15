
import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  onPhotoUploaded: () => void;
}

const PhotoUpload = ({ onPhotoUploaded }: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          file_name: fileName,
          file_path: filePath,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Photo uploaded successfully!",
      });

      onPhotoUploaded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex gap-4 mb-8">
      <Button
        onClick={handleCameraClick}
        className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
      >
        <Camera size={20} />
        Take Photo
      </Button>
      
      <Button
        onClick={handleUploadClick}
        className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
      >
        <Upload size={20} />
        Upload Photo
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

export default PhotoUpload;
