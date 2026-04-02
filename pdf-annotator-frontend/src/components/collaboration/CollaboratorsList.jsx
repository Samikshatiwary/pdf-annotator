import React, { useState } from 'react';
import { Users, MoreVertical, Mail, Shield } from 'lucide-react';
import { Dropdown, DropdownItem, Modal } from '../ui';
import { getInitials } from '../../utils/helpers';
import PermissionsPanel from './PermissionsPanel';

const CollaboratorsList = ({ collaborators, onRemove, onPermissionChange }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const handlePermissionChange = (permission) => {
    if (selectedUser) {
      onPermissionChange(selectedUser.id, permission);
      setShowPermissions(false);
      setSelectedUser(null);
    }
  };

  if (!collaborators || collaborators.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-500">No collaborators yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Share this PDF to start collaborating
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {collaborators.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 flex-1">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="avatar avatar-md bg-primary-600">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  {user.isOwner && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      Owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={12} className="text-gray-400" />
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {user.permission || 'viewer'}
                </p>
                {user.lastActive && (
                  <p className="text-xs text-gray-500">
                    {user.online ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                      </span>
                    ) : (
                      `Active ${user.lastActive}`
                    )}
                  </p>
                )}
              </div>

              {!user.isOwner && (
                <Dropdown
                  align="right"
                  trigger={
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>
                  }
                >
                  <DropdownItem
                    icon={<Shield size={16} />}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowPermissions(true);
                    }}
                  >
                    Change Permission
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => onRemove(user.id)}
                  >
                    Remove Access
                  </DropdownItem>
                </Dropdown>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showPermissions}
        onClose={() => {
          setShowPermissions(false);
          setSelectedUser(null);
        }}
        title="Manage Permissions"
        size="md"
      >
        {selectedUser && (
          <PermissionsPanel
            user={selectedUser}
            onPermissionChange={handlePermissionChange}
          />
        )}
      </Modal>
    </>
  );
};

export default CollaboratorsList;