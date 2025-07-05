import React, { useState, useEffect } from 'react';
import Tag from './Tag';

const EditPersonModal = ({ person, onUpdate, onCancel, existingTags, onSaveAndCreateTags }) => {
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
    // This effect should ONLY run when we open the modal for a NEW person.
    // We listen to person.id to prevent re-renders from erasing local state.
  }, [person?.id]);

  if (!person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = { ...person, firstname: firstname.trim(), lastname: lastname.trim(), tags: personTags };
    onUpdate(updatedPerson); // This will close the modal by default
  };

  const handleSaveAndCreate = () => {
    const newTagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (newTagNames.length > 0 && onSaveAndCreateTags) {
      const personWithCurrentState = { ...person, firstname: firstname.trim(), lastname: lastname.trim(), tags: personTags };
      onSaveAndCreateTags(personWithCurrentState, newTagNames);
      setNewTag(''); // Clear the input
    }
  };

  const handleToggleTag = (tag) => {
    setPersonTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };
  
  // Update local state if the person prop changes from the parent
  // This is how the modal stays in sync after a save-and-create action
  useEffect(() => {
    if (person) {
      setPersonTags(person.tags || []);
    }
  }, [person?.tags]);

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
            <label htmlFor="modal-new-tag">Ou créer, sauvegarder et assigner</label>
            <div className="input-group">
              <input
                type="text"
                id="modal-new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nouveaux tags (séparés par une virgule)..."
              />
              <button type="button" onClick={handleSaveAndCreate} className="button">Créer & Sauvegarder</button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="button">Enregistrer & Fermer</button>
            <button type="button" className="button secondary" onClick={onCancel}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPersonModal; 