import React from 'react';
import { Grid, List } from 'lucide-react';
import { Button } from '../ui';

const ViewToggle = ({ viewMode, onViewChange }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <Button
        onClick={() => onViewChange('grid')}
        variant={viewMode === 'grid' ? 'primary' : 'secondary'}
        size="sm"
        icon={<Grid size={16} />}
        className="!bg-transparent hover:!bg-white"
      />
      <Button
        onClick={() => onViewChange('list')}
        variant={viewMode === 'list' ? 'primary' : 'secondary'}
        size="sm"
        icon={<List size={16} />}
        className="!bg-transparent hover:!bg-white"
      />
    </div>
  );
};

export default ViewToggle;