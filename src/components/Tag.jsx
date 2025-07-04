import React from 'react';

const Tag = ({ children, onClick, status }) => {
  const className = `tag ${status || ''}`;
  return (
    <span className={className} onClick={onClick}>
      {children}
    </span>
  );
};

export default Tag; 