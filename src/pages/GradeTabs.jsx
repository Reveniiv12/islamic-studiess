import React from "react";

const GradeTabs = ({ gradeLevels, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-200">
      {Object.entries(gradeLevels).map(([key, label]) => (
        <button
          key={key}
          className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
            activeTab === key
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => onTabChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default GradeTabs;