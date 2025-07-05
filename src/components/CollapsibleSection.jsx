import React from 'react';

const CollapsibleSection = ({ title, children, isOpen, onToggle }) => {
  return (
    <section className="collapsible-section">
      <div className="collapsible-header" onClick={onToggle}>
        <h2>{title}</h2>
        <button className="toggle-button">{isOpen ? 'Réduire' : 'Déplier'}</button>
      </div>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection; 