import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Tag from './Tag';
import { TAG_CATEGORIES } from '../contexts/ContactsContext';
import CollapsibleTagSection from './CollapsibleTagSection';

const EditPersonModal = ({ 
  person, 
  onUpdate, 
  onSave,
  onCancel, 
  onClose,
  existingTags, 
  availableTags,
  onSaveAndCreateTags,
  onUpdateTagCategory 
}) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [personTags, setPersonTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Non classée');

  const normalizedTags = useMemo(() => {
    if (existingTags && Array.isArray(existingTags)) {
      return existingTags;
    } else if (availableTags && Array.isArray(availableTags)) {
      return availableTags.map(tag => 
        typeof tag === 'string' ? { 
          name: tag, 
          is_priority: false, 
          category: 'Non classée' 
        } : tag
      );
    }
    return [];
  }, [existingTags, availableTags]);

  useEffect(() => {
    if (person && normalizedTags.length > 0) {
      setFirstname(person.firstname);
      setLastname(person.lastname);
      const initialTags = normalizedTags.filter(tagObject => person.tags?.includes(tagObject.name));
      setPersonTags(initialTags);
    }
  }, [person?.id, normalizedTags]);

  useEffect(() => {
    if (person && normalizedTags.length > 0) {
       const updatedTags = normalizedTags.filter(tagObject => person.tags?.includes(tagObject.name));
       setPersonTags(updatedTags);
    }
  }, [person?.tags, normalizedTags]);

  if (!person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = { 
      ...person, 
      firstname: firstname.trim(), 
      lastname: lastname.trim(), 
      tags: personTags.map(t => t.name)
    };
    
    if (onUpdate) {
      onUpdate(updatedPerson);
    } else if (onSave) {
      onSave(updatedPerson);
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleSaveAndCreate = () => {
    const newTagNames = newTag.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (newTagNames.length > 0 && onSaveAndCreateTags) {
      // Créer les objets tags pour les nouveaux tags avec catégorie
      const newTagObjects = newTagNames.map(name => ({ 
        name, 
        is_priority: false, 
        category: selectedCategory 
      }));
      
      // Ajouter automatiquement les nouveaux tags aux tags assignés
      setPersonTags(prevTags => [...prevTags, ...newTagObjects]);
      
      // Préparer la personne avec tous les tags (existants + nouveaux)
      const allTagNames = [...personTags.map(t => t.name), ...newTagNames];
      const personWithCurrentState = { 
          ...person, 
          firstname: firstname.trim(), 
          lastname: lastname.trim(), 
          tags: allTagNames
      };
      
      onSaveAndCreateTags(personWithCurrentState, newTagNames, selectedCategory);
      setNewTag('');
    }
  };

  const handleToggleTag = (tagObject) => {
    setPersonTags(prevTags =>
      prevTags.some(t => t.name === tagObject.name)
        ? prevTags.filter(t => t.name !== tagObject.name)
        : [...prevTags, tagObject]
    );
  };

  // Grouper les tags par catégorie pour l'affichage
  const tagsByCategory = useMemo(() => {
    if (!normalizedTags || !Array.isArray(normalizedTags)) {
      return {};
    }
    
    const assignedTagNames = new Set(personTags.map(t => t.name));
    const availableTagsByCategory = {};
    
    TAG_CATEGORIES.forEach(category => {
      availableTagsByCategory[category] = normalizedTags.filter(tag => 
        (tag.category === category || (!tag.category && category === 'Non classée')) && 
        !assignedTagNames.has(tag.name)
      );
    });
    
    return availableTagsByCategory;
  }, [normalizedTags, personTags]);

  // Gestionnaire du drag & drop
  const handleOnDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Pas de destination = drop annulé
    if (!destination) return;

    // Pas de changement de position
    if (destination.droppableId === source.droppableId) return;

    // Extraire le nom du tag de l'ID draggable
    const tagName = draggableId.replace('tag-', '');
    const newCategory = destination.droppableId;

    // Mettre à jour la catégorie du tag
    if (onUpdateTagCategory) {
      onUpdateTagCategory(tagName, newCategory);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close-button" onClick={handleClose}>&times;</span>
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
                  <Tag 
                    key={tag.name} 
                    isActive={true} 
                    onClick={() => handleToggleTag(tag)} 
                    isPriority={tag.is_priority}
                  >
                    {tag.name}
                  </Tag>
                ))
              ) : (
                <span style={{color: '#888'}}>Aucun tag assigné</span>
              )}
            </div>
          </div>
          
          {/* Affichage des tags disponibles par catégorie avec drag & drop */}
          {Object.keys(tagsByCategory).length > 0 && (
            <div className="form-group">
              <label>Tags disponibles par catégorie</label>
              <p style={{ fontSize: '0.9em', color: '#666', margin: '5px 0 15px 0' }}>
                💡 Glissez-déposez les tags pour changer leur catégorie
              </p>
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="tags-by-category">
                  {TAG_CATEGORIES.map(category => {
                    const categoryTags = tagsByCategory[category] || [];
                    
                    return (
                      <CollapsibleTagSection
                        key={category}
                        title={category}
                        itemCount={categoryTags.length}
                        isOpenByDefault={false}
                      >
                        <Droppable droppableId={category}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`tags-drop-zone ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                            >
                              {categoryTags.length === 0 ? (
                                <div className="empty-category">
                                  Aucun tag disponible
                                </div>
                              ) : (
                                <div className="tags-container">
                                  {categoryTags.map((tag, index) => (
                                    <Draggable key={tag.name} draggableId={`tag-${tag.name}`} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={snapshot.isDragging ? 'dragging' : ''}
                                        >
                                          <Tag 
                                            onClick={() => handleToggleTag(tag)} 
                                            isPriority={tag.is_priority}
                                          >
                                            {tag.name}
                                          </Tag>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                </div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </CollapsibleTagSection>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="modal-new-tag">Créer et assigner un nouveau tag</label>
            <div className="create-tag-section">
              <div className="form-row">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  {TAG_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  id="modal-new-tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nouveaux tags (séparés par une virgule)..."
                  className="new-tag-input"
                />
                <button type="button" onClick={handleSaveAndCreate} className="button">
                  Créer & Sauvegarder
                </button>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="button">Enregistrer & Fermer</button>
            <button type="button" className="button secondary" onClick={handleClose}>Annuler</button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .tags-by-category {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 10px;
          background-color: #fafafa;
        }
        

        
        .tags-drop-zone {
          min-height: 50px;
          padding: 8px 12px;
          transition: background-color 0.2s ease;
        }
        
        .tags-drop-zone.drag-over {
          background-color: #e3f2fd;
          border: 2px dashed var(--primary-color);
        }
        
        .empty-category {
          text-align: center;
          color: #999;
          font-style: italic;
          padding: 15px;
          font-size: 0.9em;
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .dragging {
          opacity: 0.8;
          transform: rotate(3deg);
        }
        
        .dragging .tag {
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default EditPersonModal; 