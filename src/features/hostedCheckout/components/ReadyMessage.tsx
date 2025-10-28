import React from "react";

interface ReadyMessageProps {
  className?: string;
}

const ReadyMessage: React.FC<ReadyMessageProps> = ({ className = "" }) => {
  return (
    <div
      className={`bg-green-50 border border-green-200 p-4 rounded-lg ${className}`}
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-green-500 mt-0.5 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <div>
          <h4 className="font-semibold text-green-800">Ready to proceed!</h4>
          <p className="text-green-700 text-sm">
            Your configuration looks good and is ready to use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReadyMessage;
