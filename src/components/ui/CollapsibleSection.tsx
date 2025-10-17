import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  bgColor?: string;
  titleColor?: string;
  icon?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  bgColor = "bg-gray-50",
  titleColor = "text-gray-900",
  icon,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border rounded-lg ${bgColor}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-4 text-left flex items-center justify-between hover:bg-opacity-80 transition-colors ${titleColor}`}
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h4 className="font-medium">{title}</h4>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isExpanded ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
