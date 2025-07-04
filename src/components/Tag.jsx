import React from 'react';

const Tag = ({ children, onClick, className = '' }) => {
  return (
    <span className={`tag ${className}`} onClick={onClick}>
      {children}
    </span>
  );
};

export default Tag; 