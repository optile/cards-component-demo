import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "custom";
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className,
  style,
}) => {
  const baseClass = "px-4 py-2 rounded-md";
  let variantClass = "";

  if (variant === "primary") {
    variantClass = disabled
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "secondary") {
    variantClass = disabled
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-gray-600 text-white hover:bg-gray-700";
  } else if (variant === "custom") {
    variantClass =
      "w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className || ""}`}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;
