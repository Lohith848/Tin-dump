'use client';

import { useRef } from 'react';

export default function TinCard({
  tin,
  onSelect,
  onDragStart,
  isDragging,
}) {
  const catalog = tin.tin_catalog;
  const didDrag = useRef(false);

  if (!catalog) return null;

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didDrag.current = false;

    const startX = e.clientX;
    const startY = e.clientY;

    // Keep drag gestures working reliably on touch and pen input.
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    // Small threshold to distinguish click from drag
    const checkMove = (ev) => {
      if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
        didDrag.current = true;
      }
    };

    window.addEventListener('pointermove', checkMove);
    window.addEventListener('pointerup', () => {
      window.removeEventListener('pointermove', checkMove);
    }, { once: true });

    onDragStart(e, tin);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    // Only fire click if we didn't drag
    if (!didDrag.current) {
      onSelect(tin, e);
    }
  };

  return (
    <div
      className={`tin-card ${isDragging ? 'dragging' : ''}`}
      style={{ position: 'relative', left: 0, top: 0 }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className="tin-photo-wrap">
        <img
          className="tin-photo"
          src={catalog.photo_url}
          alt={catalog.name}
          draggable={false}
        />
        {tin.count > 1 && (
          <span className="tin-badge">×{tin.count}</span>
        )}
      </div>
      <div className="tin-name">{catalog.name}</div>
    </div>
  );
}
