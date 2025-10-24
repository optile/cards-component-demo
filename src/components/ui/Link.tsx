import React from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "./Button";

interface LinkProps {
  children: React.ReactNode;
  to: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "custom";
  className?: string;
  style?: React.CSSProperties;
  replace?: boolean;
  state?: unknown;
}

const Link: React.FC<LinkProps> = ({
  children,
  to,
  disabled = false,
  variant = "primary",
  className,
  style,
  replace,
  state,
}) => {
  if (disabled) {
    return (
      <Button
        onClick={() => {}}
        disabled={disabled}
        variant={variant}
        className={className}
        style={style}
      >
        {children}
      </Button>
    );
  }

  return (
    <RouterLink
      to={to}
      replace={replace}
      state={state}
      style={{ textDecoration: "none" }}
    >
      <Button
        onClick={() => {}}
        variant={variant}
        className={className}
        style={style}
      >
        {children}
      </Button>
    </RouterLink>
  );
};

export default Link;
