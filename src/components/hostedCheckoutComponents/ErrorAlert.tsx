import React from "react";

interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  className = "",
}) => {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 p-4 rounded-lg mb-6 ${className}`}
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-500 mt-0.5 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800">Error</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
