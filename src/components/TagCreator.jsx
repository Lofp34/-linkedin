import React, { useState } from 'react';

const TagCreator = ({ onAddNewTag }) => {
  const [newTag, setNewTag] = useState('');

  const handleCreateTag = (e) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag) {
      onAddNewTag(trimmedTag);
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
              placeholder="Entrez un nouveau tag..."
            />
            <button type="submit" className="button">Créer le tag</button>
          </div>
          <small>Les tags créés ici seront disponibles pour toutes les personnes.</small>
        </div>
      </form>
    </section>
  );
};

export default TagCreator; 