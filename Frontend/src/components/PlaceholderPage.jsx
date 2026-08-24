import React from 'react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h2 className="text-2xl font-bold text-gray-300 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">
        {description || '.'}
      </p>
    </div>
  );
};

export default PlaceholderPage;