import React from "react";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  id,
  className = "w-16 h-8 border-none cursor-pointer",
}) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 text-sm">
      {label}
    </label>
    <input
      id={id}
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  </div>
);

export default ColorPicker;
