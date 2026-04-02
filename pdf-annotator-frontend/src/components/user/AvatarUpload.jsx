import React, { useState } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

const AvatarUpload = () => {
  const { user } = useAuth();
  const { uploadAvatar, loading } = useUser();
  const [preview, setPreview] = useState(user?.avatar || null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadAvatar(file);
  };

  const handleRemove = () => {
    setPreview(null);
    // Call API to remove avatar
  };

  return (
    <div className="card max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Picture</h3>

      <div className="flex items-center gap-6">
        <div className="relative">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="avatar avatar-xl bg-primary-600">
              {getInitials(user?.name || 'User')}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Camera size={16} className="text-gray-600" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-2">Upload new picture</h4>
          <p className="text-sm text-gray-600 mb-4">
            JPG, PNG or GIF. Max size 5MB.
          </p>
          <div className="flex gap-2">
            <label>
              <Button
                as="span"
                icon={<Upload size={16} />}
                size="sm"
                loading={loading}
              >
                Upload Photo
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            {preview && (
              <Button
                onClick={handleRemove}
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;