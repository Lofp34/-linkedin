import React, { useState } from 'react';
import Tag from './Tag';

const AddPersonForm = ({ onAddPerson, existingTags }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstname || !lastname) return;

    const newPerson = {
      id: Date.now(),
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      tags: personTags
    };
    onAddPerson(newPerson);

    // Reset form
    setFirstname('');
    setLastname('');
    setPersonTags([]);
    setNewTag('');
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
    setNewTag(''); // Clear input after adding
  };

  const handleNewTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleAddNewTag();
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
            <label htmlFor="new-tag">Créer un nouveau tag</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    id="new-tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleNewTagKeyDown}
                    placeholder="Nouveau tag..."
                />
                <button type="button" className="button secondary" onClick={handleAddNewTag}>Ajouter</button>
            </div>
        </div>
        <button type="submit">Enregistrer la personne</button>
      </form>
    </section>
  );
};

export default AddPersonForm; 