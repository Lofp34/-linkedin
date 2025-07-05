import React, { useState } from 'react';

const CollapsibleTagSection = ({ 
  title, 
  children, 
  isOpenByDefault = false, 
  itemCount = 0 
}) => {
  const [isOpen, setIsOpen] = useState(isOpenByDefault);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="collapsible-tag-section">
      <div className="category-header" onClick={toggleOpen}>
        <h4 className="category-title">
          <span className="category-name">{title}</span>
          <span className="category-count">({itemCount})</span>
        </h4>
        <span className={`toggle-icon ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </div>
      
      {isOpen && (
        <div className="category-content">
          {children}
        </div>
      )}
      
      <style jsx>{`
        .collapsible-tag-section {
          margin-bottom: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .category-header:hover {
          background-color: #e9ecef;
        }
        
        .category-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .category-name {
          color: var(--primary-color);
        }
        
        .category-count {
          font-size: 0.8rem;
          color: #6c757d;
          font-weight: 500;
        }
        
        .toggle-icon {
          font-size: 0.8rem;
          color: #6c757d;
          transition: transform 0.2s ease;
        }
        
        .toggle-icon.open {
          transform: rotate(180deg);
        }
        
        .category-content {
          padding: 1rem;
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default CollapsibleTagSection; 