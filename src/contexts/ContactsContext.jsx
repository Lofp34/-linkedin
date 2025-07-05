import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Catégories disponibles pour les tags
export const TAG_CATEGORIES = [
  'Ville',
  'Secteur d\'activité',
  'Poste',
  'Entreprise',
  'Taille d\'entreprise',
  'Type de relation',
  'Compétences',
  'Centre d\'intérêt',
  'Statut',
  'Source',
  'Non classée'
];

// Créer le contexte
const ContactsContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};

// Provider qui encapsule toute la logique
export const ContactsProvider = ({ children }) => {
  // États principaux
  const [people, setPeople] = useState([]);
  const [allUniqueTags, setAllUniqueTags] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  // Gestion de la session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Récupération des tags avec catégories
  const fetchAllTags = useCallback(async () => {
    if (!session) return;
    try {
      let { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('name, is_priority, category')
        .order('category, name');

      if (tagsError) {
        console.warn("Could not fetch all columns. Falling back to basic data.");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tags')
          .select('name')
          .order('name');
        
        if (fallbackError) throw fallbackError;
        tagsData = fallbackData.map(tag => ({ 
          name: tag.name, 
          is_priority: false, 
          category: 'Non classée' 
        }));
      }
      
      setAllUniqueTags(tagsData || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      setAllUniqueTags([]);
    }
  }, [session]);

  // Récupération des contacts avec leurs tags
  const fetchAllPeople = useCallback(async () => {
    if (!session) return;
    try {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select(`
          id, 
          firstname, 
          lastname, 
          solicitation_count, 
          last_solicitation_date, 
          created_at,
          tags ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (peopleError) throw peopleError;

      const transformedPeople = peopleData.map(p => ({
        ...p,
        tags: p.tags.map(t => t.name)
      }));
      
      setPeople(transformedPeople);
    } catch (error) {
      console.error("Error fetching people:", error);
      setPeople([]);
    }
  }, [session]);

  // Récupération complète des données
  const fetchAllData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      await Promise.all([fetchAllPeople(), fetchAllTags()]);
    } catch (error) {
      console.error("Error fetching all data:", error);
    } finally {
      setLoading(false);
    }
  }, [session, fetchAllPeople, fetchAllTags]);

  // Charger les données quand la session change
  useEffect(() => {
    if (session) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [session, fetchAllData]);

  // === OPÉRATIONS CRUD POUR LES CONTACTS ===

  // Ajouter un contact
  const addPerson = useCallback(async ({ firstname, lastname, tags: tagNames }) => {
    if (!session) return;
    setOperationLoading(true);
    try {
      const { data: personData, error: personError } = await supabase
        .from('people')
        .insert([{ firstname, lastname }])
        .select('id')
        .single();
      
      if (personError) throw personError;
      const personId = personData.id;

      if (tagNames && tagNames.length > 0) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tagNames);
        
        if (tagsError) throw tagsError;
        
        const associations = tagsData.map(tag => ({ 
          person_id: personId, 
          tag_id: tag.id 
        }));
        
        const { error: assocError } = await supabase
          .from('person_tags')
          .insert(associations);
        
        if (assocError) throw assocError;
      }

      await fetchAllPeople();
      return personData;
    } catch (error) {
      console.error("Error adding person:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, fetchAllPeople]);

  // Mettre à jour un contact
  const updatePerson = useCallback(async (updatedPerson) => {
    if (!session) return;
    setOperationLoading(true);
    try {
      const { firstname, lastname, tags: tagNames, id } = updatedPerson;
      
      // Mettre à jour les informations de base
      const { error: updateError } = await supabase
        .from('people')
        .update({ firstname, lastname })
        .eq('id', id);
      
      if (updateError) throw updateError;

      // Supprimer les associations existantes
      const { error: deleteError } = await supabase
        .from('person_tags')
        .delete()
        .eq('person_id', id);
      
      if (deleteError) throw deleteError;

      // Ajouter les nouvelles associations
      if (tagNames && tagNames.length > 0) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', tagNames);
        
        if (tagsError) throw tagsError;
        
        const associations = tagsData.map(tag => ({ 
          person_id: id, 
          tag_id: tag.id 
        }));
        
        const { error: assocError } = await supabase
          .from('person_tags')
          .insert(associations);
        
        if (assocError) throw assocError;
      }

      await fetchAllPeople();
    } catch (error) {
      console.error("Error updating person:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, fetchAllPeople]);

  // Supprimer un contact
  const deletePerson = useCallback(async (personId) => {
    if (!session) return;
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);
      
      if (error) throw error;
      await fetchAllPeople();
    } catch (error) {
      console.error("Error deleting person:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, fetchAllPeople]);

  // Supprimer plusieurs contacts
  const deleteMultiplePeople = useCallback(async (personIds) => {
    if (!session || !personIds.length) return;
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .in('id', personIds);
      
      if (error) throw error;
      await fetchAllPeople();
    } catch (error) {
      console.error("Error deleting multiple people:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, fetchAllPeople]);

  // === OPÉRATIONS POUR LES TAGS ===

  // Ajouter un tag au système avec catégorie
  const addTagToSystem = useCallback(async (tagName, category = 'Non classée') => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ 
          name: tagName.trim(),
          category: category 
        }])
        .select();
      
      if (error && error.code !== '23505') { // Ignore duplicate errors
        throw error;
      }
      
      if (data) {
        await fetchAllTags();
      }
      return data;
    } catch (error) {
      console.error("Error adding tag:", error);
      throw error;
    }
  }, [session, fetchAllTags]);

  // Supprimer un tag du système
  const deleteTagFromSystem = useCallback(async (tagName) => {
    if (!session) return;
    try {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();
      
      if (tagError) throw tagError;
      const tagId = tagData.id;

      // Supprimer les associations
      const { error: assocError } = await supabase
        .from('person_tags')
        .delete()
        .eq('tag_id', tagId);
      
      if (assocError) throw assocError;

      // Supprimer le tag
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
      
      if (deleteError) throw deleteError;

      await Promise.all([fetchAllTags(), fetchAllPeople()]);
    } catch (error) {
      console.error("Error deleting tag:", error);
      throw error;
    }
  }, [session, fetchAllTags, fetchAllPeople]);

  // Basculer la priorité d'un tag
  const toggleTagPriority = useCallback(async (tagName, newStatus) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('tags')
        .update({ is_priority: newStatus })
        .eq('name', tagName);
      
      if (error) throw error;

      // Mise à jour optimiste
      setAllUniqueTags(prevTags =>
        prevTags.map(tag =>
          tag.name === tagName ? { ...tag, is_priority: newStatus } : tag
        )
      );
    } catch (error) {
      console.error("Error toggling tag priority:", error);
      throw error;
    }
  }, [session]);

  // === OPÉRATIONS EN MASSE ===

  // Ajouter des tags à plusieurs contacts
  const bulkAddTags = useCallback(async (personIds, tagNames) => {
    if (!session || !personIds.length || !tagNames.length) return;
    setOperationLoading(true);
    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tagNames);
      
      if (tagsError) throw tagsError;

      const associations = personIds.flatMap(personId =>
        tagsData.map(tag => ({ person_id: personId, tag_id: tag.id }))
      );

      if (associations.length > 0) {
        const { error: insertError } = await supabase
          .from('person_tags')
          .upsert(associations, { onConflict: 'person_id, tag_id' });
        
        if (insertError) throw insertError;
      }

      await fetchAllPeople();
    } catch (error) {
      console.error("Error bulk adding tags:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, fetchAllPeople]);

  // Supprimer des tags de plusieurs contacts
  const bulkRemoveTags = useCallback(async (personIds, tagNames) => {
    if (!session || !personIds.length || !tagNames.length) return;
    setOperationLoading(true);
    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tagNames);
      
      if (tagsError) throw tagsError;

      const tagIds = tagsData.map(t => t.id);
      
      if (tagIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('person_tags')
          .delete()
          .in('person_id', personIds)
          .in('tag_id', tagIds);
        
        if (deleteError) throw deleteError;
      }

      await fetchAllPeople();
    } catch (error) {
      console.error("Error bulk removing tags:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, fetchAllPeople]);

  // Import de contacts depuis CSV
  const importPeople = useCallback(async (importedPeople) => {
    if (!session) return;
    setOperationLoading(true);
    try {
      const results = { added: 0, skipped: 0, errors: [] };
      
      for (const person of importedPeople) {
        try {
          await addPerson(person);
          results.added++;
        } catch (error) {
          results.errors.push({ person, error: error.message });
          results.skipped++;
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error importing people:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, [session, addPerson]);

  // Fonction utile pour grouper les tags par catégorie
  const getTagsByCategory = useCallback(() => {
    const grouped = {};
    TAG_CATEGORIES.forEach(category => {
      grouped[category] = allUniqueTags.filter(tag => tag.category === category);
    });
    return grouped;
  }, [allUniqueTags]);

  // Valeurs exposées par le contexte
  const contextValue = {
    // État
    session,
    people,
    allUniqueTags,
    loading,
    operationLoading,
    
    // Données utiles
    TAG_CATEGORIES,
    getTagsByCategory,
    
    // Opérations CRUD pour les contacts
    addPerson,
    updatePerson,
    deletePerson,
    deleteMultiplePeople,
    
    // Opérations pour les tags
    addTagToSystem,
    deleteTagFromSystem,
    toggleTagPriority,
    
    // Opérations en masse
    bulkAddTags,
    bulkRemoveTags,
    importPeople,
    
    // Fonctions de rafraîchissement
    fetchAllTags,
    fetchAllPeople,
    fetchAllData
  };

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  );
}; 