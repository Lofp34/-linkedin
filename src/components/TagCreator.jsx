import React, { useState } from 'react';

const TagCreator = ({ 
  onAddNewTag, // Ancienne API
  onAddTag,    // Nouvelle API
  existingTags // Pour éviter les doublons
}) => {
  const [newTag, setNewTag] = useState('');

  const handleCreateTag = (e) => {
    e.preventDefault();
    const tagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    if (tagNames.length > 0) {
      // Utiliser la fonction disponible selon l'API
      const addTagFunction = onAddTag || onAddNewTag;
      
      if (typeof addTagFunction === 'function') {
        tagNames.forEach(tagName => {
          addTagFunction(tagName);
        });
        setNewTag('');
      } else {
        console.error('No valid callback function provided to TagCreator');
      }
    }
  };

  return (
    <section className="tag-creator-section">
      <h2>Créer un nouveau tag</h2>
      <form onSubmit={handleCreateTag} className="tag-creator-form">
        <div className="form-group">
          <label htmlFor="global-new-tag">Nom du tag</label>
          <div className="input-group">
            <input
              type="text"
              id="global-new-tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nouveaux tags (séparés par une virgule)..."
            />
            <button type="submit" className="button">Créer</button>
          </div>
          <small>Les tags créés ici seront disponibles pour toutes les personnes.</small>
        </div>
      </form>
    </section>
  );
};

export default TagCreator; 