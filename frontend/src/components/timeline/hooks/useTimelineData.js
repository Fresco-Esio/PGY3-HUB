// Timeline Data Hook - Manages timeline data operations and transformations
import { useState, useCallback, useMemo } from 'react';

export const useTimelineData = (initialEntries = []) => {
  const [entries, setEntries] = useState(initialEntries);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  // Add new entry
  const addEntry = useCallback((entryData) => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      timestamp: new Date().toISOString(),
      orderIndex: entries.length,
      patient_narrative: '',
      clinical_notes: '',
      ...entryData
    };
    
    setEntries(prev => [...prev, newEntry]);
    return newEntry;
  }, [entries.length]);

  // Update entry
  const updateEntry = useCallback((entryId, updates) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, ...updates, updated_at: new Date().toISOString() }
        : entry
    ));
  }, []);

  // Delete entry
  const deleteEntry = useCallback((entryId) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    if (selectedEntry === entryId) {
      setSelectedEntry(null);
    }
    if (editingEntry === entryId) {
      setEditingEntry(null);
    }
  }, [selectedEntry, editingEntry]);

  // Reorder entries
  const reorderEntries = useCallback((fromIndex, toIndex) => {
    setEntries(prev => {
      const newEntries = [...prev];
      const [removed] = newEntries.splice(fromIndex, 1);
      newEntries.splice(toIndex, 0, removed);
      
      // Update order indices
      return newEntries.map((entry, index) => ({
        ...entry,
        orderIndex: index
      }));
    });
  }, []);

  // Insert entry at specific position
  const insertEntry = useCallback((insertAfterIndex, entryData) => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      timestamp: new Date().toISOString(),
      orderIndex: insertAfterIndex + 1,
      patient_narrative: '',
      clinical_notes: '',
      ...entryData
    };

    setEntries(prev => {
      const newEntries = [...prev];
      newEntries.splice(insertAfterIndex + 1, 0, newEntry);
      
      // Update order indices for entries after insertion point
      return newEntries.map((entry, index) => ({
        ...entry,
        orderIndex: index
      }));
    });

    return newEntry;
  }, []);

  // Convert entries to D3 nodes format
  const timelineNodes = useMemo(() => {
    return entries.map((entry, index) => ({
      id: entry.id,
      label: entry.title || `Entry ${index + 1}`,
      type: 'timeline-entry',
      orderIndex: entry.orderIndex || index,
      data: entry,
      // Zigzag positioning
      x: 300 + (index % 2 === 0 ? -100 : 100),
      y: 100 + (index * 120)
    }));
  }, [entries]);

  // Get entry by ID
  const getEntryById = useCallback((entryId) => {
    return entries.find(entry => entry.id === entryId);
  }, [entries]);

  // Get entries sorted by order
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [entries]);

  // Bulk operations
  const bulkUpdate = useCallback((updates) => {
    setEntries(prev => prev.map(entry => {
      const update = updates.find(u => u.id === entry.id);
      return update ? { ...entry, ...update.data } : entry;
    }));
  }, []);

  return {
    entries,
    sortedEntries,
    timelineNodes,
    selectedEntry,
    editingEntry,
    setEntries,
    setSelectedEntry,
    setEditingEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    reorderEntries,
    insertEntry,
    getEntryById,
    bulkUpdate
  };
};