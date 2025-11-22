import React from 'react';

/**
 * Basic styled input wrapper.
 *
 * @param {{ className?: string }} props
 */
export default function Input({ className = '', ...props }) {
  return <input className={`form-input ${className}`} {...props} />;
}
