'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTins } from '@/lib/useTins';
import { useCatalog } from '@/lib/useCatalog';
import TinCard from './TinCard';
import TinPopover from './TinPopover';
import Fab from './Fab';
import FabOverlay from './FabOverlay';

// Grid cell size for auto-placement
const CELL_W = 140;
const CELL_H = 200;
const PADDING = 40;

function findOpenSpot(existingTins, containerWidth) {
  const cols = Math.max(1, Math.floor((containerWidth - PADDING * 2) / CELL_W));
  const occupied = new Set();

  existingTins.forEach((tin) => {
    const col = Math.round((tin.x - PADDING) / CELL_W);
    const row = Math.round((tin.y - PADDING) / CELL_H);
    occupied.add(`${col},${row}`);
  });

  // Find first open cell
  for (let row = 0; row < 1000; row++) {
    for (let col = 0; col < cols; col++) {
      if (!occupied.has(`${col},${row}`)) {
        return {
          x: PADDING + col * CELL_W,
          y: PADDING + row * CELL_H,
        };
      }
    }
  }

  return { x: PADDING, y: PADDING };
}

export default function Canvas() {
  const {
    tins,
    loading: tinsLoading,
    fetchUserTins,
    addTinToBoard,
    incrementTin,
    moveTin,
    deleteTin,
  } = useTins();

  const {
    catalog,
    loading: catalogLoading,
    fetchCatalog,
    addToCatalog,
  } = useCatalog();

  const [fabOpen, setFabOpen] = useState(false);
  const [selectedTin, setSelectedTin] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const canvasInnerRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    fetchUserTins();
    fetchCatalog();
  }, [fetchUserTins, fetchCatalog]);

  // Track canvas dimensions to place tins responsively
  useEffect(() => {
    const updateCanvasSize = () => {
      const el = canvasInnerRef.current;
      if (!el) return;
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Handle FAB toggle
  const toggleFab = useCallback(() => {
    setFabOpen((prev) => !prev);
    setSelectedTin(null);
    if (!fabOpen) {
      fetchCatalog();
    }
  }, [fabOpen, fetchCatalog]);

  // Handle searching from overlay
  const handleSearch = useCallback((term) => {
    fetchCatalog(term);
  }, [fetchCatalog]);

  // Handle selecting a catalog tin from overlay
  const handleSelectCatalogTin = useCallback(async (catalogTin) => {
    const containerWidth = canvasInnerRef.current?.clientWidth || containerSize.width || window.innerWidth;
    const spot = findOpenSpot(tins, containerWidth);
    await addTinToBoard(catalogTin.id, spot.x, spot.y);
  }, [tins, addTinToBoard, containerSize.width]);

  // Handle adding a brand new tin
  const handleAddNewTin = useCallback(async (name, photoBlob) => {
    const catalogEntry = await addToCatalog(name, photoBlob);
    if (catalogEntry) {
      const containerWidth = canvasInnerRef.current?.clientWidth || containerSize.width || window.innerWidth;
      const spot = findOpenSpot(tins, containerWidth);
      await addTinToBoard(catalogEntry.id, spot.x, spot.y);
    }
  }, [tins, addToCatalog, addTinToBoard, containerSize.width]);

  // Tin selection (popover)
  const handleSelectTin = useCallback((tin, e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = e.clientX - rect.left + canvasRef.current.scrollLeft;
    let y = e.clientY - rect.top + canvasRef.current.scrollTop;

    // Keep popover in viewport
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const popW = 200;
    const popH = 240;

    let screenX = e.clientX + 10;
    let screenY = e.clientY - popH / 2;

    if (screenX + popW > vpW - 16) screenX = e.clientX - popW - 10;
    if (screenY < 16) screenY = 16;
    if (screenY + popH > vpH - 16) screenY = vpH - popH - 16;

    setSelectedTin(tin);
    setPopoverPos({ x: screenX, y: screenY });
    setFabOpen(false);
  }, []);

  // Popover actions
  const handleIncrement = useCallback(async (userTinId) => {
    await incrementTin(userTinId);
    setSelectedTin(null);
  }, [incrementTin]);

  const handleDelete = useCallback(async (userTinId) => {
    await deleteTin(userTinId);
    setSelectedTin(null);
  }, [deleteTin]);

  // Drag handlers
  const dragRef = useRef(null);

  const handleDragStart = useCallback((e, tin) => {
    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;

    dragRef.current = {
      tinId: tin.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: tin.x,
      origY: tin.y,
      scrollLeft,
      scrollTop,
      hasMoved: false,
    };

    setDragState(tin.id);

    const handleMove = (ev) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        d.hasMoved = true;
      }

      if (d.hasMoved) {
        const newX = Math.max(0, d.origX + dx);
        const newY = Math.max(0, d.origY + dy);

        // Optimistic visual update via direct DOM for performance
        const el = document.querySelector(`[data-tin-id="${d.tinId}"]`);
        if (el) {
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
        }
        d.currentX = newX;
        d.currentY = newY;
      }
    };

    const handleUp = () => {
      const d = dragRef.current;
      if (d && d.hasMoved && d.currentX !== undefined) {
        moveTin(d.tinId, Math.round(d.currentX), Math.round(d.currentY));
      }
      dragRef.current = null;
      setDragState(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [moveTin]);

  // Close popover when clicking canvas
  const handleCanvasClick = useCallback(() => {
    setSelectedTin(null);
  }, []);

  // Calculate canvas min-height based on tin positions
  const viewportHeight = Math.max(containerSize.height || 800, 800);
  const maxY = tins.reduce(
    (max, t) => Math.max(max, t.y + CELL_H + PADDING),
    Math.round(viewportHeight * 1.2)
  );

  return (
    <>
      <div className="canvas" ref={canvasRef} onClick={handleCanvasClick}>
        <div
          className="canvas-inner"
          ref={canvasInnerRef}
          style={{ minHeight: `${maxY}px` }}
        >
          {!tinsLoading && tins.length === 0 && (
            <div className="canvas-empty">
              <div className="canvas-empty-text">tap + to start your collection</div>
              <div className="canvas-empty-sub">your tins will live here</div>
            </div>
          )}

          {tins.map((tin) => (
            <div key={tin.id} data-tin-id={tin.id} style={{
              position: 'absolute',
              left: `${tin.x}px`,
              top: `${tin.y}px`,
            }}>
              <TinCard
                tin={tin}
                onSelect={handleSelectTin}
                onDragStart={handleDragStart}
                isDragging={dragState === tin.id}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedTin && (
        <TinPopover
          tin={selectedTin}
          position={popoverPos}
          onIncrement={handleIncrement}
          onDelete={handleDelete}
          onClose={() => setSelectedTin(null)}
        />
      )}

      <Fab isOpen={fabOpen} onClick={toggleFab} />

      {fabOpen && (
        <FabOverlay
          catalog={catalog}
          catalogLoading={catalogLoading}
          onSearch={handleSearch}
          onSelectCatalogTin={handleSelectCatalogTin}
          onAddNewTin={handleAddNewTin}
          onClose={() => setFabOpen(false)}
        />
      )}
    </>
  );
}
