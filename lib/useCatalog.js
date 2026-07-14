'use client';

import { useState, useCallback } from 'react';
import { getSupabase } from './supabase';

export function useCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalog = useCallback(async (searchTerm = '') => {
    setLoading(true);
    const supabase = getSupabase();

    let query = supabase
      .from('tin_catalog')
      .select('*')
      .order('name', { ascending: true });

    if (searchTerm.trim()) {
      query = query.ilike('name', `%${searchTerm.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching catalog:', error);
      setCatalog([]);
    } else {
      setCatalog(data || []);
    }
    setLoading(false);
    return data || [];
  }, []);

  const addToCatalog = useCallback(async (name, photoBlob) => {
    const supabase = getSupabase();

    // Upload photo to storage
    const fileName = `${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}.webp`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tin-photos')
      .upload(fileName, photoBlob, {
        contentType: 'image/webp',
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tin-photos')
      .getPublicUrl(fileName);

    const photoUrl = urlData.publicUrl;

    // Insert into catalog
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tin_catalog')
      .insert({
        name,
        photo_url: photoUrl,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to catalog:', error);
      return null;
    }

    return data;
  }, []);

  return { catalog, loading, fetchCatalog, addToCatalog };
}
