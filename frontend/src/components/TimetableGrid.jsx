import React, { useState } from 'react';
import './TimetableGrid.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { slot: 0, label: '9:00' },
  { slot: 1, label: '10:00' },
  { slot: 2, label: '11:00' },
  { slot: 3, label: '12:00' },
  { slot: 4, label: '1:00' },
  { slot: 5, label: '2:00' },
  { slot: 6, label: '3:00' },
  { slot: 7, label: '4:00' },
];

const TimetableGrid = ({
  entries = [],
  allotments = [],
  onCellClick,
  onAllotClick,
  canEdit = false,
  isAdmin = false,
  isHod = false,
  hodDepartmentId = null,
  showClassroom = false
}) => {
  const [tooltip, setTooltip] = useState(null);

  const getEntry = (day, slot) => {
    return entries.find(e => e.day === day && e.timeSlot === slot);
  };

  const getAllotment = (day, slot) => {
    return allotments.find(a => a.day === day && a.timeSlot === slot);
  };

  const handleMouseEnter = (e, entry) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      entry
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  const getDeptColor = (entry) => {
    return entry?.department?.color || '#6366f1';
  };

  const canHodEditSlot = (day, slot) => {
    if (!isHod || !hodDepartmentId) return false;
    const allotment = getAllotment(day, slot);
    return allotment && allotment.department?._id === hodDepartmentId;
  };

  const renderCell = (day, slot) => {
    const entry = getEntry(day, slot);
    const allotment = getAllotment(day, slot);

    // If this is second slot of a lab, skip rendering (handled by colspan)
    if (entry?.isSecondSlot) return null;

    const isLab = entry?.type === 'lab';
    const allotColor = allotment?.department?.color || null;
    const allotDeptName = allotment?.department?.name || null;

    // Determine if this cell is editable
    const hodCanEdit = isHod && canHodEditSlot(day, slot);
    const cellEditable = isAdmin || hodCanEdit;

    if (!entry) {
      return (
        <div
          key={`${day}-${slot}`}
          className={`grid-cell empty-cell ${cellEditable ? 'clickable' : ''} ${allotColor ? 'allotted-cell' : ''}`}
          onClick={() => {
            if (isAdmin && onAllotClick) {
              onAllotClick(day, slot, allotment);
            } else if (hodCanEdit && onCellClick) {
              onCellClick(day, slot);
            }
          }}
          style={{
            gridColumn: 'span 1',
            ...(allotColor ? {
              background: `${allotColor}15`,
              borderBottom: `2px solid ${allotColor}40`
            } : {})
          }}
        >
          {allotDeptName && (
            <span className="allot-label" style={{ color: allotColor }}>{allotDeptName}</span>
          )}
          {cellEditable && <span className="empty-dot">{isAdmin ? '⚙' : '+'}</span>}
        </div>
      );
    }

    const color = getDeptColor(entry);
    return (
      <div
        key={`${day}-${slot}`}
        className={`grid-cell filled-cell ${isLab ? 'lab-cell' : ''} ${cellEditable ? 'clickable' : ''}`}
        style={{
          gridColumn: isLab ? 'span 2' : 'span 1',
          background: `${color}12`,
          borderLeft: `3px solid ${color}`
        }}
        onMouseEnter={(e) => handleMouseEnter(e, entry)}
        onMouseLeave={handleMouseLeave}
        onClick={() => cellEditable && onCellClick?.(day, slot, entry)}
      >
        <div className="cell-subject" style={{ color }}>{entry.subject || 'No Subject'}</div>
        <div className="cell-faculty">{entry.faculty?.name || ''}</div>
        <div className="cell-info">
          {entry.batch ? `${entry.batch}` : entry.department?.name}
          {entry.section ? ` (${entry.section}${entry.subsection ? `-${entry.subsection}` : ''})` : ''}
        </div>
        {showClassroom && entry.classroom && (
          <div className="cell-classroom">{entry.classroom.name}</div>
        )}
        {isLab && <span className="lab-badge">LAB</span>}
      </div>
    );
  };

  return (
    <div className="timetable-wrapper">
      <div className="timetable-grid">
        {/* Header row */}
        <div className="grid-header corner-cell">Day / Time</div>
        {TIME_SLOTS.map(t => (
          <div key={t.slot} className="grid-header time-header">{t.label}</div>
        ))}

        {/* Data rows */}
        {DAYS.map(day => {
          const cells = [];
          let skip = false;

          for (let s = 0; s < TIME_SLOTS.length; s++) {
            if (skip) {
              skip = false;
              continue;
            }
            const entry = getEntry(day, s);
            if (entry && entry.type === 'lab' && !entry.isSecondSlot) {
              skip = true;
            }
            const cell = renderCell(day, s);
            if (cell) cells.push(cell);
          }

          return (
            <React.Fragment key={day}>
              <div className="grid-header day-header">{day.substring(0, 3)}</div>
              {cells}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="grid-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          <div className="tooltip-row">
            <strong>Faculty:</strong> {tooltip.entry.faculty?.name || 'N/A'}
          </div>
          <div className="tooltip-row">
            <strong>Batch:</strong> {tooltip.entry.batch || tooltip.entry.department?.name || 'N/A'}
          </div>
          <div className="tooltip-row">
            <strong>Section:</strong> {tooltip.entry.section}
            {tooltip.entry.subsection && `-${tooltip.entry.subsection}`}
          </div>
          <div className="tooltip-row">
            <strong>Subject:</strong> {tooltip.entry.subject || 'N/A'}
          </div>
          <div className="tooltip-row">
            <strong>Type:</strong> {tooltip.entry.type}
          </div>
          {showClassroom && tooltip.entry.classroom && (
            <div className="tooltip-row">
              <strong>Room:</strong> {tooltip.entry.classroom.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { DAYS, TIME_SLOTS };
export default TimetableGrid;
