import React from 'react';

const SettingsModal = ({ isOpen, onClose, tags, onDeleteTag }) => {
  if (!isOpen) return null;

  const handleDelete = (tag) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tag}" ? Il sera retiré de toutes les fiches de contact.`)) {
      onDeleteTag(tag);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Gestion des Tags</h2>
        <p>Cliquez sur un tag pour le supprimer définitivement de l'application.</p>
        
        {tags.length > 0 ? (
          <ul className="tags-list">
            {tags.map(tag => (
              <li key={tag}>
                <span>{tag}</span>
                <button className="button danger" onClick={() => handleDelete(tag)}>Supprimer</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun tag à gérer.</p>
        )}
        
        <style jsx>{`
          .tags-list {
            list-style: none;
            padding: 0;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
          }
          .tags-list li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-radius: 5px;
          }
          .tags-list li:nth-child(odd) {
            background-color: var(--secondary-color);
          }
          .tags-list button {
            padding: 5px 10px;
            font-size: 0.9em;
          }
        `}</style>

      </div>
    </div>
  );
};

export default SettingsModal; 