import React, { useState } from 'react';

const TagCreator = ({ onAddNewTag }) => {
  const [newTag, setNewTag] = useState('');

  const handleCreateTag = (e) => {
    e.preventDefault();
    const tagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    if (tagNames.length > 0) {
      tagNames.forEach(tagName => {
        onAddNewTag(tagName);
      });
      setNewTag('');
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