import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  className = "form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out",
}) => (
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
    <span className="ml-2 text-sm text-gray-700">{label}</span>
  </label>
);

export default Checkbox;
