'use client';

export default function TinPopover({ tin, position, onIncrement, onDelete, onClose }) {
  const catalog = tin.tin_catalog;
  if (!catalog) return null;

  return (
    <>
      <div className="popover-backdrop" onClick={onClose} />
      <div
        className="popover"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <img
          className="popover-photo"
          src={catalog.photo_url}
          alt={catalog.name}
          draggable={false}
        />
        <div className="popover-name">{catalog.name}</div>
        <div className="popover-count">×{tin.count}</div>
        <div className="popover-actions">
          <button
            className="btn btn-primary"
            onClick={() => onIncrement(tin.id)}
            type="button"
          >
            +1
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onDelete(tin.id)}
            type="button"
          >
            Remove
          </button>
        </div>
      </div>
    </>
  );
}
