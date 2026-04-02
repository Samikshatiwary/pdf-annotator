import React from 'react';
import ActivityLog from '../components/user/ActivityLog';

const Activity = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
        <p className="text-gray-600 mt-1">View your recent activity and actions</p>
      </div>

      <ActivityLog />
    </div>
  );
};

export default Activity;