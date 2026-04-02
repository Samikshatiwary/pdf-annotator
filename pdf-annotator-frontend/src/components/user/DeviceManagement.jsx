import React, { useState } from 'react';
import { Smartphone, Monitor, Tablet, LogOut } from 'lucide-react';
import { Button, ConfirmDialog } from '../ui';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: 'Windows PC',
      type: 'desktop',
      browser: 'Chrome',
      location: 'New Delhi, India',
      lastActive: new Date(),
      isCurrent: true,
    },
    {
      id: 2,
      name: 'iPhone 14',
      type: 'mobile',
      browser: 'Safari',
      location: 'Mumbai, India',
      lastActive: new Date(Date.now() - 86400000),
      isCurrent: false,
    },
  ]);
  const [showLogoutAll, setShowLogoutAll] = useState(false);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="text-blue-600" size={20} />;
      case 'tablet':
        return <Tablet className="text-green-600" size={20} />;
      default:
        return <Monitor className="text-purple-600" size={20} />;
    }
  };

  const handleLogoutDevice = (deviceId) => {
    setDevices(devices.filter(d => d.id !== deviceId));
    toast.success('Device logged out successfully');
  };

  const handleLogoutAll = () => {
    setDevices(devices.filter(d => d.isCurrent));
    setShowLogoutAll(false);
    toast.success('Logged out from all other devices');
  };

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
          <Button
            onClick={() => setShowLogoutAll(true)}
            variant="danger"
            size="sm"
            icon={<LogOut size={16} />}
          >
            Logout All Devices
          </Button>
        </div>

        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{device.name}</p>
                    {device.isCurrent && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {device.browser} • {device.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last active: {formatDateTime(device.lastActive)}
                  </p>
                </div>
              </div>

              {!device.isCurrent && (
                <Button
                  onClick={() => handleLogoutDevice(device.id)}
                  variant="secondary"
                  size="sm"
                  icon={<LogOut size={14} />}
                >
                  Logout
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Security Tip:</strong> If you don't recognize a device, log it out immediately 
            and change your password.
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutAll}
        onClose={() => setShowLogoutAll(false)}
        onConfirm={handleLogoutAll}
        title="Logout All Devices"
        message="Are you sure you want to logout from all other devices? You'll need to login again on those devices."
        confirmText="Logout All"
        variant="danger"
      />
    </>
  );
};

export default DeviceManagement;