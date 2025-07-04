import React, { useState, useEffect } from 'react';
import Tag from './Tag';

const EditPersonModal = ({ person, onUpdate, onCancel, existingTags }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [tags, setTags] = useState('');

  // When the 'person' prop changes, update the form's state
  useEffect(() => {
    if (person) {
      setFirstname(person.firstname);
      setLastname(person.lastname);
      setTags(person.tags.join(', '));
    }
  }, [person]);

  if (!person) {
    return null; // Don't render anything if no person is being edited
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = {
      ...person,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      tags: tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
    };
    onUpdate(updatedPerson);
  };
  
  const addTagToInput = (tag) => {
    let currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
        currentTags.push(tag);
        setTags(currentTags.join(', '));
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
            <label htmlFor="edit-tags">Tags</label>
            <input
              type="text"
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <small>Séparez les tags par des virgules, ou cliquez sur un tag existant.</small>
            <div className="tags-container" style={{ marginTop: '10px' }}>
                {existingTags.map(tag => (
                  <Tag key={tag} onClick={() => addTagToInput(tag)}>{tag}</Tag>
                ))}
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