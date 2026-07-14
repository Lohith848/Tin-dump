'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function CropTool({ imageFile, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Image state
  const [img, setImg] = useState(null);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);

  // Load image
  useEffect(() => {
    if (!imageFile) return;

    const image = new Image();
    image.onload = () => {
      setImg(image);

      // Center image and scale to fit
      const container = containerRef.current;
      if (!container) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // Scale so the image covers the crop frame area nicely
      const frameW = 120;
      const frameH = 160;
      const scaleToFit = Math.max(frameW / image.width, frameH / image.height) * 1.5;

      setScale(scaleToFit);
      setImgPos({
        x: (cw - image.width * scaleToFit) / 2,
        y: (ch - image.height * scaleToFit) / 2,
      });
    };
    image.src = URL.createObjectURL(imageFile);

    return () => URL.revokeObjectURL(image.src);
  }, [imageFile]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !img) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(
      img,
      imgPos.x,
      imgPos.y,
      img.width * scale,
      img.height * scale
    );
  }, [img, imgPos, scale]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pan handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - imgPos.x, y: e.clientY - imgPos.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    setImgPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // Export crop
  const handleConfirm = async () => {
    if (!img || exporting) return;
    setExporting(true);

    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Frame position (center of container)
    const frameW = 120;
    const frameH = 160;
    const frameX = (cw - frameW) / 2;
    const frameY = (ch - frameH) / 2;

    // Calculate source coordinates
    const srcX = (frameX - imgPos.x) / scale;
    const srcY = (frameY - imgPos.y) / scale;
    const srcW = frameW / scale;
    const srcH = frameH / scale;

    // Draw to offscreen canvas at higher res
    const outputW = 240;
    const outputH = 320;
    const offscreen = document.createElement('canvas');
    offscreen.width = outputW;
    offscreen.height = outputH;
    const ctx = offscreen.getContext('2d');
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);

    offscreen.toBlob(
      (blob) => {
        setExporting(false);
        onConfirm(blob);
      },
      'image/webp',
      0.85
    );
  };

  return (
    <div>
      <div
        className="crop-container"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <canvas className="crop-canvas" ref={canvasRef} />
        <div className="crop-frame" />
      </div>
      <p className="crop-hint">Drag to reposition · Scroll to zoom</p>
      <div className="add-flow-actions">
        <button className="btn btn-ghost" onClick={onCancel} type="button">
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!img || exporting}
          type="button"
        >
          {exporting ? 'Cropping…' : 'Crop & Save'}
        </button>
      </div>
    </div>
  );
}
