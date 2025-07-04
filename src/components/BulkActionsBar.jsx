import React from 'react';

const BulkActionsBar = ({ selectedCount, totalCount, onSelectAll, onDeselectAll, onDeleteSelected, onEditTags }) => {
  if (totalCount === 0 && selectedCount === 0) {
    return null;
  }

  const allAreSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="bulk-actions-bar">
      <span>
        {selectedCount > 0
          ? `${selectedCount} / ${totalCount} sélectionné(s)`
          : `${totalCount} résultat(s)`}
      </span>
      <div className="bulk-actions-buttons">
        {!allAreSelected && totalCount > 0 && <button onClick={onSelectAll}>Tout sélectionner</button>}
        {selectedCount > 0 && <button onClick={onDeselectAll}>Tout désélectionner</button>}
        {selectedCount > 0 && <button onClick={onEditTags}>Modifier les tags</button>}
        {selectedCount > 0 && (
          <button onClick={onDeleteSelected} className="delete">
            Supprimer la sélection
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkActionsBar; 