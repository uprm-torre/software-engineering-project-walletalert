import React from 'react';

const VARIANT_CLASSNAMES = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  destructive: "btn btn-destructive",
};

/**
 * Styled button supporting simple variants.
 *
 * @param {{ variant?: 'primary'|'secondary'|'ghost'|'destructive', className?: string }} props
 */
export default function Button({ variant = "primary", className = "", ...props }) {
  const baseClass = VARIANT_CLASSNAMES[variant] || VARIANT_CLASSNAMES.primary;
  return <button className={`${baseClass} ${className}`.trim()} {...props} />;
}
