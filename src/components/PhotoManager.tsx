
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import LevelTagBadge from '@/components/LevelTagBadge';
import { Upload, Camera, Eye } from 'lucide-react';

interface PhotoSlot {
  level: number;
  title: string;
  description: string;
  image?: string;
}

const PhotoManager = () => {
  const [photoSlots] = useState<PhotoSlot[]>([
    { level: 1, title: 'Faceless Photo', description: 'Hands, hobby, or object - no visible face' },
    { level: 2, title: 'Side View', description: 'Profile or back view' },
    { level: 3, title: 'Blurred Face', description: 'Face with artistic blur' },
    { level: 4, title: 'Full Face', description: 'Clear face photo' },
  ]);

  const handleUpload = (level: number) => {
    console.log(`Uploading photo for level ${level}`);
    // Here you would handle file upload
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {photoSlots.map((slot) => (
        <div key={slot.level} className="bg-gray-50 dark:bg-romantic-dark-card rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <LevelTagBadge level={slot.level} />
            <Eye className="w-4 h-4 text-gray-400" />
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
            className="w-full bg-romantic-red hover:bg-romantic-rose text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
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
