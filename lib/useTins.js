'use client';

import { useState, useCallback } from 'react';
import { getSupabase } from './supabase';

export function useTins() {
  const [tins, setTins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserTins = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('user_tins')
      .select(`
        *,
        tin_catalog (
          id,
          name,
          photo_url
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching user tins:', error);
      setTins([]);
    } else {
      setTins(data || []);
    }
    setLoading(false);
    return data || [];
  }, []);

  const addTinToBoard = useCallback(async (catalogTinId, x, y) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Check if this tin already exists on the user's board
    const { data: existing } = await supabase
      .from('user_tins')
      .select('*')
      .eq('catalog_tin_id', catalogTinId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Increment count instead
      const { data, error } = await supabase
        .from('user_tins')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id)
        .select(`*, tin_catalog (id, name, photo_url)`)
        .single();

      if (error) {
        console.error('Error incrementing tin:', error);
        return null;
      }

      setTins(prev => prev.map(t => t.id === data.id ? data : t));
      return data;
    }

    // Insert new
    const { data, error } = await supabase
      .from('user_tins')
      .insert({
        user_id: user.id,
        catalog_tin_id: catalogTinId,
        x,
        y,
        count: 1,
      })
      .select(`*, tin_catalog (id, name, photo_url)`)
      .single();

    if (error) {
      console.error('Error adding tin to board:', error);
      return null;
    }

    setTins(prev => [...prev, data]);
    return data;
  }, []);

  const incrementTin = useCallback(async (userTinId) => {
    const supabase = getSupabase();

    const tin = tins.find(t => t.id === userTinId);
    if (!tin) return;

    const { data, error } = await supabase
      .from('user_tins')
      .update({ count: tin.count + 1 })
      .eq('id', userTinId)
      .select(`*, tin_catalog (id, name, photo_url)`)
      .single();

    if (error) {
      console.error('Error incrementing tin:', error);
      return;
    }

    setTins(prev => prev.map(t => t.id === data.id ? data : t));
  }, [tins]);

  const moveTin = useCallback(async (userTinId, x, y) => {
    const supabase = getSupabase();

    // Optimistic update
    setTins(prev => prev.map(t =>
      t.id === userTinId ? { ...t, x, y } : t
    ));

    const { error } = await supabase
      .from('user_tins')
      .update({ x, y })
      .eq('id', userTinId);

    if (error) {
      console.error('Error moving tin:', error);
      // Revert on error
      await fetchUserTins();
    }
  }, [fetchUserTins]);

  const deleteTin = useCallback(async (userTinId) => {
    const supabase = getSupabase();

    setTins(prev => prev.filter(t => t.id !== userTinId));

    const { error } = await supabase
      .from('user_tins')
      .delete()
      .eq('id', userTinId);

    if (error) {
      console.error('Error deleting tin:', error);
      await fetchUserTins();
    }
  }, [fetchUserTins]);

  return {
    tins,
    loading,
    fetchUserTins,
    addTinToBoard,
    incrementTin,
    moveTin,
    deleteTin,
  };
}
