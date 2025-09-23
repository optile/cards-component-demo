import React from "react";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  selectedValue,
  onChange,
  className = "flex items-center space-x-2 cursor-pointer",
}) => (
  <div className="flex items-center gap-4">
    {options.map((option) => (
      <label key={option.value} className={className}>
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={selectedValue === option.value}
          onChange={() => onChange(option.value)}
          className="form-radio h-4 w-4 text-blue-600"
        />
        <span>{option.label}</span>
      </label>
    ))}
  </div>
);

export default RadioGroup;
