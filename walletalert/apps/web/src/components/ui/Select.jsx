import React from 'react';

/**
 * Basic styled select wrapper.
 *
 * @param {{ className?: string, children?: React.ReactNode }} props
 */
export default function Select({ className = '', children, ...props }) {
  return (
    <select className={`form-input ${className}`} {...props}>
      {children}
    </select>
  );
}
