import React from 'react';
import ProfileSettings from '../components/user/ProfileSettings';
import AvatarUpload from '../components/user/AvatarUpload';
import PasswordChange from '../components/user/PasswordChange';

const Profile = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      <div className="space-y-6">
        <AvatarUpload />
        <ProfileSettings />
        <PasswordChange />
      </div>
    </div>
  );
};

export default Profile;