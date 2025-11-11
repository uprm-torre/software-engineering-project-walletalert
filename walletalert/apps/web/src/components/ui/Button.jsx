import React from 'react';

const VARIANT_CLASSNAMES = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  destructive: "btn btn-destructive",
};

export default function Button({ variant = "primary", className = "", ...props }) {
  const baseClass = VARIANT_CLASSNAMES[variant] || VARIANT_CLASSNAMES.primary;
  return <button className={`${baseClass} ${className}`.trim()} {...props} />;
}
