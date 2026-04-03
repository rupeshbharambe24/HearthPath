import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LevelTagBadge from '@/components/LevelTagBadge';
import { Upload, Camera, Eye, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { normalizePhotoLevels } from '@/lib/heartpath';

interface PhotoSlot {
  level: number;
  title: string;
  description: string;
  image?: string;
  uploaded: boolean;
}

const PhotoManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([
    { level: 1, title: 'Faceless Photo', description: 'Hands, hobby, or object - no visible face', uploaded: false },
    { level: 2, title: 'Side View', description: 'Profile or back view', uploaded: false },
    { level: 3, title: 'Blurred Face', description: 'Face with artistic blur', uploaded: false },
    { level: 4, title: 'Full Face', description: 'Clear face photo', uploaded: false },
  ]);
  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserPhotos();
    }
  }, [user?.id]);

  const loadUserPhotos = async () => {
    if (!user?.id) return;

    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('photo_levels')
        .eq('id', user.id)
        .single();

      const existingPhotoLevels = normalizePhotoLevels(userRow?.photo_levels);
      const updatedSlots = await Promise.all(
        photoSlots.map(async (slot) => {
          const { data } = await supabase.storage
            .from('profile-photos')
            .list(`${user.id}/`, { search: `level_${slot.level}` });

          if (data && data.length > 0) {
            const { data: urlData } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(`${user.id}/${data[0].name}`);

            return {
              ...slot,
              image: urlData.publicUrl || existingPhotoLevels[`level_${slot.level}`],
              uploaded: true
            };
          }
          if (existingPhotoLevels[`level_${slot.level}`]) {
            return {
              ...slot,
              image: existingPhotoLevels[`level_${slot.level}`],
              uploaded: true,
            };
          }
          return slot;
        })
      );
      setPhotoSlots(updatedSlots);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleUpload = async (level: number) => {
    if (!user?.id) return;

    // Check if previous level photo exists (except for level 1)
    if (level > 1) {
      const previousLevel = photoSlots.find(slot => slot.level === level - 1);
      if (!previousLevel?.uploaded) {
        toast({
          title: "Previous level required",
          description: `Please upload a Level ${level - 1} photo first.`,
          variant: "destructive",
        });
        return;
      }
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }

      setUploading(level);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `level_${level}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);

        // Update photo slots
        const nextSlots = photoSlots.map((slot) =>
          slot.level === level
            ? { ...slot, image: urlData.publicUrl, uploaded: true }
            : slot
        );
        setPhotoSlots(nextSlots);

        // Update user's photo_levels in database
        const { error: dbError } = await supabase
          .from('users')
          .update({
            photo_levels: {
              ...nextSlots.reduce<Record<string, string>>((acc, slot) => {
                if (slot.image) {
                  acc[`level_${slot.level}`] = slot.image;
                }
                return acc;
              }, {}),
            }
          })
          .eq('id', user.id);

        if (dbError) {
          console.error('Error updating photo levels:', dbError);
        }

        toast({
          title: "Photo uploaded! 📸",
          description: `Level ${level} photo has been uploaded successfully.`,
        });

      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploading(null);
      }
    };

    input.click();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {photoSlots.map((slot) => (
        <div key={slot.level} className="bg-gray-50 dark:bg-romantic-dark-card rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <LevelTagBadge level={slot.level} />
            <div className="flex items-center gap-2">
              {slot.uploaded && <Check className="w-4 h-4 text-green-500" />}
              <Eye className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {slot.title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {slot.description}
          </p>
          
          <div className="aspect-square bg-white dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center border border-gray-200 dark:border-gray-600">
            {slot.image ? (
              <img src={slot.image} alt={slot.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No photo</p>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => handleUpload(slot.level)}
            disabled={uploading === slot.level}
            className="w-full bg-romantic-red hover:bg-romantic-rose text-white disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading === slot.level ? 'Uploading...' : slot.uploaded ? 'Replace Photo' : 'Upload Photo'}
          </Button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            Visible at Level {slot.level}+
          </p>
        </div>
      ))}
    </div>
  );
};

export default PhotoManager;
