
import React from 'react';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  isEditing,
  onChange,
  multiline = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {isEditing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-romantic-red focus:border-transparent dark:bg-romantic-dark-card dark:text-white"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-romantic-red focus:border-transparent dark:bg-romantic-dark-card dark:text-white"
          />
        )
      ) : (
        <p className="p-3 bg-gray-50 dark:bg-romantic-dark-card rounded-lg text-gray-900 dark:text-gray-100">
          {value}
        </p>
      )}
    </div>
  );
};

export default EditableField;
