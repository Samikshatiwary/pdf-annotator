import React from 'react';

const Loading = ({ size = 'md', fullScreen = false, text = 'Loading...' }) => {
  const sizes = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex-center bg-white bg-opacity-80 z-50">
        <div className="text-center">
          <div className={`spinner ${sizes[size]} mx-auto mb-4`} />
          {text && <p className="text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center py-8">
      <div className="text-center">
        <div className={`spinner ${sizes[size]} mx-auto mb-2`} />
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

export default Loading;