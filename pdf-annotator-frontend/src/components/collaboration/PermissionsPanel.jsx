import React, { useState } from 'react';
import { Shield, Eye, MessageSquare, Edit3, Crown } from 'lucide-react';
import { Button } from '../ui';

const PermissionsPanel = ({ user, onPermissionChange }) => {
  const [selectedPermission, setSelectedPermission] = useState(user?.permission || 'view');

  const permissions = [
    {
      id: 'view',
      icon: Eye,
      title: 'Viewer',
      description: 'Can view and download',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'comment',
      icon: MessageSquare,
      title: 'Commenter',
      description: 'Can view and comment',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'edit',
      icon: Edit3,
      title: 'Editor',
      description: 'Can view, comment, and edit',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'owner',
      icon: Crown,
      title: 'Owner',
      description: 'Full control',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const handleSave = () => {
    onPermissionChange(selectedPermission);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-primary-600" size={20} />
        <h3 className="font-semibold text-gray-900">Permissions</h3>
      </div>

      <div className="space-y-2">
        {permissions.map(({ id, icon: Icon, title, description, color, bgColor }) => (
          <button
            key={id}
            onClick={() => setSelectedPermission(id)}
            disabled={id === 'owner' && user?.role !== 'owner'}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedPermission === id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${id === 'owner' && user?.role !== 'owner' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={color} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{title}</p>
                  {selectedPermission === id && (
                    <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={selectedPermission === user?.permission}
        className="w-full"
      >
        Update Permission
      </Button>
    </div>
  );
};

export default PermissionsPanel;