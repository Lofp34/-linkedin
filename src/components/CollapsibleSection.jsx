import React, { useState } from 'react';

const CollapsibleSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <section className="collapsible-section">
      <div className="collapsible-header" onClick={toggleOpen}>
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