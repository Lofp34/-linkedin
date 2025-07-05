import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TAG_CATEGORIES } from '../contexts/ContactsContext';
import CollapsibleTagSection from './CollapsibleTagSection';

const SettingsModal = ({ isOpen, onClose, tags, onDeleteTag, onTogglePriority, onUpdateTagCategory }) => {
  const [modalSize, setModalSize] = useState({ width: 800, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const modalRef = useRef(null);
  const resizeRef = useRef(null);

  // Gestionnaire de redimensionnement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !modalRef.current) return;

      const rect = modalRef.current.getBoundingClientRect();
      const newWidth = Math.max(600, e.clientX - rect.left + 10);
      const newHeight = Math.max(400, e.clientY - rect.top + 10);

      setModalSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleDelete = (tagName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagName}" ? Il sera retiré de toutes les fiches de contact.`)) {
      onDeleteTag(tagName);
    }
  };

  // Grouper les tags par catégorie
  const tagsByCategory = tags.reduce((acc, tag) => {
    const category = tag.category || 'Non classée';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {});

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

  // Condition de rendu APRÈS tous les hooks
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div 
        ref={modalRef}
        className="modal-content resizable-modal"
        style={{ 
          width: `${modalSize.width}px`, 
          height: `${modalSize.height}px`,
          maxWidth: '90vw',
          maxHeight: '90vh',
          cursor: isResizing ? 'nw-resize' : 'default'
        }}
      >
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Gestion des Tags</h2>
        <p>
          <strong>💡 Astuce :</strong> Glissez-déposez les tags pour changer leur catégorie !<br/>
          <strong>🔧 Redimensionnement :</strong> Utilisez la poignée en bas à droite pour agrandir la fenêtre.<br/>
          <strong>⚡ Rapide :</strong> Utilisez le dropdown "Catégorie" pour changer directement la catégorie.<br/>
          Cliquez sur l'étoile pour marquer comme prioritaire. Cliquez sur "Supprimer" pour effacer.
        </p>
        
        {tags.length > 0 ? (
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="tags-management">
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
                              Aucun tag dans cette catégorie
                            </div>
                          ) : (
                            <ul className="tags-list">
                              {categoryTags.sort((a, b) => b.is_priority - a.is_priority).map((tag, index) => (
                                <Draggable key={tag.name} draggableId={`tag-${tag.name}`} index={index}>
                                  {(provided, snapshot) => (
                                    <li
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`tag-item ${snapshot.isDragging ? 'dragging' : ''}`}
                                    >
                                      <div className="tag-content">
                                        <button 
                                          className={`priority-toggle ${tag.is_priority ? 'active' : ''}`}
                                          onClick={() => onTogglePriority(tag.name, !tag.is_priority)}
                                          title={tag.is_priority ? "Retirer la priorité" : "Marquer comme prioritaire"}
                                        >
                                          &#9733;
                                        </button>
                                        <span className="tag-name">{tag.name}</span>
                                        <div className="tag-actions">
                                          <select
                                            className="category-selector"
                                            value={tag.category || 'Non classée'}
                                            onChange={(e) => onUpdateTagCategory(tag.name, e.target.value)}
                                            title="Changer la catégorie"
                                          >
                                            {TAG_CATEGORIES.map(cat => (
                                              <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                          </select>
                                          <button 
                                            className="button danger" 
                                            onClick={() => handleDelete(tag.name)}
                                          >
                                            Supprimer
                                          </button>
                                        </div>
                                      </div>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                            </ul>
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
        ) : (
          <p>Aucun tag à gérer.</p>
        )}
        
        {/* Poignée de redimensionnement */}
        <div
          ref={resizeRef}
          className="resize-handle"
          onMouseDown={handleResizeStart}
          title="Glisser pour redimensionner"
        >
          <div className="resize-icon">⟲</div>
        </div>
        
        <style jsx>{`
          .resizable-modal {
            position: relative;
            overflow: hidden;
            resize: none;
            min-width: 600px;
            min-height: 400px;
          }
          
          .resize-handle {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, transparent 0%, transparent 30%, var(--primary-color) 30%, var(--primary-color) 70%, transparent 70%);
            cursor: nw-resize;
            z-index: 1000;
            border-radius: 0 0 8px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
            transition: opacity 0.2s ease;
          }
          
          .resize-handle:hover {
            opacity: 1;
          }
          
          .resize-icon {
            font-size: 12px;
            color: var(--primary-color);
            font-weight: bold;
            transform: rotate(45deg);
          }
          
          .tags-management {
            margin-top: 20px;
            height: calc(100% - 120px);
            overflow-y: auto;
            padding-right: 10px;
          }
          

          
          .tags-drop-zone {
            min-height: 60px;
            padding: 1rem;
            transition: background-color 0.2s ease;
            border-radius: 0 0 8px 8px;
          }
          
          .tags-drop-zone.drag-over {
            background-color: #e3f2fd;
            border: 2px dashed var(--primary-color);
          }
          
          .empty-category {
            text-align: center;
            color: #888;
            font-style: italic;
            padding: 1rem;
            border: 2px dashed #ccc;
            border-radius: 6px;
            background-color: #fafafa;
          }
          
          .tags-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .tag-item {
            background-color: white;
            margin-bottom: 8px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
            transition: all 0.2s ease;
            cursor: grab;
          }
          
          .tag-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transform: translateY(-1px);
          }
          
          .tag-item.dragging {
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            transform: rotate(5deg);
            cursor: grabbing;
          }
          
          .tag-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
          }
          
          .tag-name {
            flex-grow: 1;
            margin: 0 1rem;
            font-weight: 500;
          }
          
          .tag-actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          
          .category-selector {
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.85rem;
            background-color: white;
            cursor: pointer;
            transition: border-color 0.2s ease;
            max-width: 120px;
          }
          
          .category-selector:hover {
            border-color: var(--primary-color);
          }
          
          .category-selector:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
          }
          
          .priority-toggle {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.5rem;
            color: #ccc;
            transition: color 0.2s ease;
          }
          
          .priority-toggle.active {
            color: #ffc107;
          }
          
          .priority-toggle:hover {
            color: #ffb300;
          }
          
          .button.danger {
            padding: 5px 10px;
            font-size: 0.9em;
            border-radius: 4px;
          }
          
          /* Empêcher la sélection de texte pendant le redimensionnement */
          .resizable-modal * {
            user-select: ${isResizing ? 'none' : 'auto'};
          }
        `}</style>
      </div>
    </div>
  );
};

export default SettingsModal; 