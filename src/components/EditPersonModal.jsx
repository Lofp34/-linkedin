import React, { useState, useEffect } from 'react';
import Tag from './Tag';

const EditPersonModal = ({ person, onUpdate, onCancel, existingTags }) => {
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

  const handleToggleTag = (tag) => {
    setPersonTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };
  
  const handleAddNewTag = () => {
    const tagToAdd = newTag.trim().toLowerCase();
    if (tagToAdd && !personTags.includes(tagToAdd)) {
        setPersonTags([...personTags, tagToAdd]);
    }
    setNewTag('');
  };

  const handleNewTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
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
            <label>Tags</label>
            <div className="tags-container">
              {personTags.map(tag => (
                <Tag key={tag} className="active" onClick={() => handleToggleTag(tag)}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Cliquer pour ajouter/retirer un tag existant :</label>
            <div className="tags-container" style={{ marginTop: '10px' }}>
              {existingTags.filter(t => !personTags.includes(t)).map(tag => (
                <Tag key={tag} onClick={() => handleToggleTag(tag)}>{tag}</Tag>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edit-new-tag">Créer un nouveau tag</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                id="edit-new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleNewTagKeyDown}
                placeholder="Nouveau tag..."
              />
              <button type="button" className="button secondary" onClick={handleAddNewTag}>Ajouter</button>
            </div>
          </div>
          <button type="submit" className="button">Enregistrer</button>
          <button type="button" className="button secondary" onClick={onCancel} style={{ marginLeft: '10px' }}>Annuler</button>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal; 