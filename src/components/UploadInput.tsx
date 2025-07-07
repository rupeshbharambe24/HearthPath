
import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadInputProps {
  onFileSelect: (file: File) => void;
  preview?: string;
  error?: string;
}

const UploadInput: React.FC<UploadInputProps> = ({ onFileSelect, preview, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG or PNG image');
      return;
    }
    
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }
    
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 p-4 bg-romantic-light-pink dark:bg-romantic-dark-card rounded-lg border border-romantic-red/20">
        <h4 className="font-semibold text-romantic-red dark:text-romantic-pink mb-2">
          📸 Photo Guidelines
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Upload a faceless photo (hands, hobby, pets, etc.)</li>
          <li>• No visible faces for privacy and mystery</li>
          <li>• Show your personality through your interests</li>
          <li>• JPG/PNG format, max 5MB</li>
        </ul>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-romantic-red bg-romantic-light-pink dark:bg-romantic-dark-card/50' 
            : 'border-gray-300 dark:border-gray-600 hover:border-romantic-red hover:bg-romantic-light-pink/50 dark:hover:bg-romantic-dark-card/30'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleInputChange}
          className="hidden"
        />
        
        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded-lg mx-auto"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to change photo
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-romantic-red mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Upload your faceless photo
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag & drop or click to browse
              </p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default UploadInput;
