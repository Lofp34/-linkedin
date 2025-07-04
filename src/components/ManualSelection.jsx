import React, { useState, useMemo } from 'react';

const ManualSelection = ({ selectedPeople, onClear }) => {
  const [copySuccess, setCopySuccess] = useState('');

  const resultString = useMemo(() => {
    return selectedPeople.map(p => `@${p.firstname} ${p.lastname}`).join(' ');
  }, [selectedPeople]);

  const handleCopy = () => {
    navigator.clipboard.writeText(resultString).then(() => {
      setCopySuccess('Copié !');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('Erreur');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <section>
      <h2>Sélection Manuelle</h2>
      <div className="form-group" id="manual-selection-group">
        <label htmlFor="manual-selection-result">Personnes ajoutées manuellement</label>
        <textarea
          id="manual-selection-result"
          value={resultString}
          readOnly
          placeholder="Cliquez sur 'Ajouter' sur une fiche ci-dessous..."
        />
        <div style={{ position: 'absolute', top: '35px', right: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={handleCopy} className={`button secondary ${copySuccess && 'success'}`}>
            {copySuccess || 'Copier'}
          </button>
          <button onClick={onClear} className="button danger">
            Effacer
          </button>
        </div>
      </div>
    </section>
  );
};

export default ManualSelection; 