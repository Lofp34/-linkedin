import React from 'react';
import Tag from './Tag';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const FilteredResult = ({ 
    people, 
    existingTags, 
    tagStates, 
    onToggleTag, 
    onCopy, 
    onReset,
    maxSolicitations,
    onMaxSolicitationsChange,
    solicitedBefore,
    onSolicitedBeforeChange,
    textToCopy
}) => {
    return (
        <section className="filtered-result-container">
            <h2>Générer une liste de @</h2>
            <div className="tags-filter-container">
                <h3>Filtrer par tags</h3>
                <div className="tags-list">
                    {existingTags.map(tag => (
                        <Tag 
                            key={tag}
                            onClick={() => onToggleTag(tag)}
                            status={tagStates[tag]}
                        >
                            {tag}
                        </Tag>
                    ))}
                </div>
            </div>

            <div className="activity-filter-container">
                <h3>Filtrer par activité</h3>
                <div className="filter-controls">
                    <div className="form-group">
                        <label htmlFor="max-solicitations">Sollicitations max.</label>
                        <input 
                            type="number"
                            id="max-solicitations"
                            value={maxSolicitations}
                            onChange={(e) => onMaxSolicitationsChange(e.target.value)}
                            placeholder="Ex: 3"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="solicited-before">Non sollicité depuis le</label>
                        <DatePicker 
                            id="solicited-before"
                            selected={solicitedBefore}
                            onChange={(date) => onSolicitedBeforeChange(date)}
                            dateFormat="dd/MM/yyyy"
                            isClearable
                            placeholderText="Cliquez pour choisir"
                            className="date-picker-input"
                        />
                    </div>
                </div>
            </div>

            <div className="result-preview">
                <h3>Résultat ({people.length} personne(s))</h3>
                <div id="result-group">
                    <label htmlFor="result-textarea">Résultat du filtre</label>
                    <textarea 
                        id="result-textarea" 
                        rows="5" 
                        value={textToCopy} 
                        readOnly 
                    />
                    <button onClick={onCopy} className="button-copy">
                        Copier
                    </button>
                    <button onClick={onReset} className="button-reset button secondary">
                        Réinitialiser
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FilteredResult; 