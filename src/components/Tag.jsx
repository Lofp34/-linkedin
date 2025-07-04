import React from 'react';

const Tag = ({ children, onClick, isActive }) => {
  const className = `tag ${isActive ? 'active' : ''}`;
  return (
    <span className={className} onClick={onClick}>
      {children}
    </span>
  );
};

export default Tag; 