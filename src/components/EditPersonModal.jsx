import React, { useState, useEffect } from 'react';
import Tag from './Tag';

const EditPersonModal = ({ person, onUpdate, onCancel, existingTags, onAddNewTag }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (person) {
      setFirstname(person.firstname);
      setLastname(person.lastname);
      setPersonTags(person.tags || []);
    }
  }, [person]);

  if (!person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = { ...person, firstname: firstname.trim(), lastname: lastname.trim(), tags: personTags };
    onUpdate(updatedPerson);
  };

  const handleCreateNewTag = () => {
    const tagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (tagNames.length > 0 && onAddNewTag) {
      tagNames.forEach(tagName => {
        onAddNewTag(tagName);
        // Automatically add the new tag to the person
        handleToggleTag(tagName);
      });
      setNewTag('');
    }
  };

  const handleToggleTag = (tag) => {
    setPersonTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={onCancel}>&times;</span>
        <h2>Modifier la personne</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-firstname">Prénom</label>
            <input
              type="text"
              id="edit-firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-lastname">Nom</label>
            <input
              type="text"
              id="edit-lastname"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Tags assignés</label>
            <div className="tags-container" style={{ minHeight: '30px', border: '1px solid var(--border-color)', borderRadius: '5px', padding: '10px', marginBottom: '10px' }}>
              {personTags.length > 0 ? (
                personTags.map(tag => (
                  <Tag key={tag} isActive={true} onClick={() => handleToggleTag(tag)}>{tag}</Tag>
                ))
              ) : (
                <span style={{color: '#888'}}>Aucun tag assigné</span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Cliquer pour assigner un tag existant</label>
            <div className="tags-container">
              {existingTags.filter(t => !personTags.includes(t)).map(tag => (
                <Tag key={tag} isActive={false} onClick={() => handleToggleTag(tag)}>{tag}</Tag>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="modal-new-tag">Ou créer un nouveau tag</label>
            <div className="input-group">
              <input
                type="text"
                id="modal-new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nom du nouveau tag..."
              />
              <button type="button" onClick={handleCreateNewTag} className="button">Créer</button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="button">Enregistrer</button>
            <button type="button" className="button secondary" onClick={onCancel}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal; 