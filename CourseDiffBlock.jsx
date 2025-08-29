import React from 'react';

const CourseDiffBlock = ({ diff }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md mb-6 border border-gray-200">
      <h2 className="text-xl font-bold text-blue-600 mb-4">Course Comparison</h2>

      {/* Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Title</h3>
        <p><span className="font-medium text-gray-600">Previous:</span> {diff.previous?.title || 'N/A'}</p>
        <p><span className="font-medium text-gray-600">Current:</span> {diff.current?.title || 'N/A'}</p>
      </div>

      {/* Graduate Attribute Indicator */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Graduate Attribute Indicator</h3>
        <p><span className="font-medium text-gray-600">Previous:</span> {diff.previous?.graduateAttributeIndicator || 'N/A'}</p>
        <p><span className="font-medium text-gray-600">Current:</span> {diff.current?.graduateAttributeIndicator || 'N/A'}</p>
      </div>

      {/* Graduate Attribute Mapping Level */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Graduate Attribute Mapping Level</h3>
        <p><span className="font-medium text-gray-600">Previous:</span> {diff.previous?.graduateAttributeLevel || 'N/A'}</p>
        <p><span className="font-medium text-gray-600">Current:</span> {diff.current?.graduateAttributeLevel || 'N/A'}</p>
      </div>

      {/* Mapping Levels (Array) */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Mapping Levels</h3>
        <p>
          <span className="font-medium text-gray-600">Previous:</span>{' '}
          {Array.isArray(diff.previous?.mappingLevels) && diff.previous.mappingLevels.length > 0
            ? diff.previous.mappingLevels.join(', ')
            : 'N/A'}
        </p>
        <p>
          <span className="font-medium text-gray-600">Current:</span>{' '}
          {Array.isArray(diff.current?.mappingLevels) && diff.current.mappingLevels.length > 0
            ? diff.current.mappingLevels.join(', ')
            : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default CourseDiffBlock;
