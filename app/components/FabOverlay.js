'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import CropTool from './CropTool';

// Flow states: 'search' | 'upload' | 'crop' | 'confirm'
export default function FabOverlay({
  catalog,
  catalogLoading,
  onSearch,
  onSelectCatalogTin,
  onAddNewTin,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [flow, setFlow] = useState('search'); // search | upload | crop | confirm
  const [selectedFile, setSelectedFile] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-focus search
  useEffect(() => {
    if (flow === 'search' && searchRef.current) {
      searchRef.current.focus();
    }
  }, [flow]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFlow('crop');
    }
  };

  const handleCropConfirm = (blob) => {
    setCroppedBlob(blob);
    setNewName(searchTerm);
    setFlow('confirm');
  };

  const handleSave = async () => {
    if (!croppedBlob || !newName.trim() || saving) return;
    setSaving(true);
    await onAddNewTin(newName.trim(), croppedBlob);
    setSaving(false);
    onClose();
  };

  const handleSelectTin = (catalogTin) => {
    onSelectCatalogTin(catalogTin);
    onClose();
  };

  // Search view
  if (flow === 'search') {
    return (
      <>
        <div className="overlay-backdrop" onClick={onClose} />
        <div className="overlay-panel">
          <div className="overlay-search">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search your tins…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overlay-list">
            {catalogLoading ? (
              <div className="overlay-loading">Loading…</div>
            ) : catalog.length > 0 ? (
              catalog.map((item) => (
                <button
                  key={item.id}
                  className="overlay-item"
                  onClick={() => handleSelectTin(item)}
                  type="button"
                >
                  <img
                    className="overlay-item-photo"
                    src={item.photo_url}
                    alt={item.name}
                    draggable={false}
                  />
                  <div className="overlay-item-info">
                    <div className="overlay-item-name">{item.name}</div>
                    <div className="overlay-item-hint">tap to add</div>
                  </div>
                </button>
              ))
            ) : searchTerm.trim() ? (
              <div className="overlay-empty">
                No tins found for "{searchTerm}"
              </div>
            ) : (
              <div className="overlay-empty">
                No tins in catalog yet
              </div>
            )}
          </div>

          <button
            className="overlay-add-new"
            onClick={() => setFlow('upload')}
            type="button"
          >
            <div className="overlay-add-new-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <span className="overlay-add-new-text">Add a new tin</span>
          </button>
        </div>
      </>
    );
  }

  // Upload view
  if (flow === 'upload') {
    return (
      <>
        <div className="overlay-backdrop" onClick={onClose} />
        <div className="overlay-panel">
          <div className="add-flow">
            <div className="add-flow-title">Add a new tin</div>
            <button
              className="add-flow-upload"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span>Upload a photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="add-flow-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setFlow('search')}
                type="button"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Crop view
  if (flow === 'crop') {
    return (
      <>
        <div className="overlay-backdrop" onClick={onClose} />
        <div className="overlay-panel">
          <div className="add-flow">
            <div className="add-flow-title">Crop your tin</div>
            <CropTool
              imageFile={selectedFile}
              onConfirm={handleCropConfirm}
              onCancel={() => {
                setSelectedFile(null);
                setFlow('upload');
              }}
            />
          </div>
        </div>
      </>
    );
  }

  // Confirm view (name + save)
  if (flow === 'confirm') {
    return (
      <>
        <div className="overlay-backdrop" onClick={onClose} />
        <div className="overlay-panel">
          <div className="add-flow">
            <div className="add-flow-title">Name your tin</div>
            {croppedBlob && (
              <img
                src={URL.createObjectURL(croppedBlob)}
                alt="Cropped preview"
                style={{
                  width: 80,
                  height: 106,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  display: 'block',
                  margin: '0 auto 12px',
                }}
                draggable={false}
              />
            )}
            <input
              className="add-flow-input"
              type="text"
              placeholder="e.g. Diet Coke"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="add-flow-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setFlow('crop')}
                type="button"
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!newName.trim() || saving}
                type="button"
              >
                {saving ? 'Saving…' : 'Add to collection'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
