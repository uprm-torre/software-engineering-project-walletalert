import React from 'react';

export default function Select({ className = '', children, ...props }) {
  return (
    <select className={`form-input ${className}`} {...props}>
      {children}
    </select>
  );
}