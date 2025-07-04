import React, { useState } from 'react';
import Tag from './Tag';

const AddPersonForm = ({ onAddPerson, existingTags }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstname || !lastname) return;

    const newPerson = {
      id: Date.now(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      tags: tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag)
    };
    onAddPerson(newPerson);

    // Reset form
    setFirstname('');
    setLastname('');
    setTags('');
  };

  const addTagToInput = (tag) => {
    let currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
    const tagExists = currentTags.some(t => t.toLowerCase() === tag.toLowerCase());
    if (!tagExists) {
        currentTags.push(tag);
        setTags(currentTags.join(', '));
    }
  };

  return (
    <section>
      <h2>Ajouter une personne</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstname">Prénom</label>
          <input
            type="text"
            id="firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastname">Nom</label>
          <input
            type="text"
            id="lastname"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ex: influenceur, vente, paris"
          />
          <small>Séparez les tags par des virgules, ou cliquez sur un tag existant pour l'ajouter.</small>
          <div className="tags-container" style={{ marginTop: '10px' }}>
            {existingTags.map(tag => (
              <Tag key={tag} onClick={() => addTagToInput(tag)}>{tag}</Tag>
            ))}
          </div>
        </div>
        <button type="submit">Ajouter la personne</button>
      </form>
    </section>
  );
};

export default AddPersonForm; 