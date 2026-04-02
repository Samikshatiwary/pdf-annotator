import React, { useState } from 'react';
import Preferences from '../components/user/Preferences';
import StorageUsage from '../components/user/StorageUsage';
import DeviceManagement from '../components/user/DeviceManagement';
import DataExport from '../components/user/DataExport';
import AccountDeletion from '../components/user/AccountDeletion';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');

  const tabs = [
    { id: 'preferences', label: 'Preferences' },
    { id: 'storage', label: 'Storage' },
    { id: 'devices', label: 'Devices' },
    { id: 'data', label: 'Data Export' },
    { id: 'account', label: 'Account' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your application settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'preferences' && <Preferences />}
        {activeTab === 'storage' && <StorageUsage />}
        {activeTab === 'devices' && <DeviceManagement />}
        {activeTab === 'data' && <DataExport />}
        {activeTab === 'account' && <AccountDeletion />}
      </div>
    </div>
  );
};

export default Settings;