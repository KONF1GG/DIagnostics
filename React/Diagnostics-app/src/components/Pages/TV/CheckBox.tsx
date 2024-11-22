import React from "react";
import "../../CSS/CheckBox.css";

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  className?: string; 
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  disabled,
  className = "", 
  onChange,
}) => {
  return (
    <div className={`checkbox-group ${className}`}>
      <label className="checkbox-label" htmlFor={id}>
        <input
          type="checkbox"
          id={id}
          className="checkbox-input"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <span className="checkbox-custom"></span>
        <span className="fs-4">{label}</span>
      </label>
    </div>
  );
};

export default Checkbox;
