import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './TimetableGrid.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
  const { systemSettings } = useAuth();
  const timeSlots = systemSettings?.timeSlots || Array.from({length: 8}, (_,i)=>({slot:i, label:`${i+9}:00`}));
  const [tooltip, setTooltip] = useState(null);

  const getEntries = (day, slot) => {
    return entries.filter(e => e.day === day && e.timeSlot === slot);
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
    const slotEntries = getEntries(day, slot);
    const allotment = getAllotment(day, slot);

    const hodCanEdit = isHod && canHodEditSlot(day, slot);
    const cellEditable = isAdmin || hodCanEdit;

    if (slotEntries.length === 0) {
      const allotColor = allotment?.department?.color || null;
      const allotDeptName = allotment?.department?.name || null;
      return (
        <div
          key={`${day}-${slot}`}
          className={`grid-cell empty-cell ${cellEditable ? 'clickable' : ''} ${allotColor ? 'allotted-cell' : ''}`}
          onClick={() => {
            if (isAdmin && onAllotClick) onAllotClick(day, slot, allotment);
            else if (hodCanEdit && onCellClick) onCellClick(day, slot);
          }}
          style={{ gridColumn: 'span 1', ...(allotColor ? { background: `${allotColor}15`, borderBottom: `2px solid ${allotColor}40` } : {}) }}
        >
          {allotDeptName && <span className="allot-label" style={{ color: allotColor }}>{allotDeptName}</span>}
          {cellEditable && <span className="empty-dot">{isAdmin ? '⚙' : '+'}</span>}
        </div>
      );
    }

    const renderableEntries = slotEntries.filter(e => !e.isSecondSlot);
    if (renderableEntries.length === 0) return null; // Only had second slot entries

    const isLab = renderableEntries.some(e => e.type === 'lab');

    return (
      <div
        key={`${day}-${slot}`}
        className={`grid-cell filled-cell ${isLab ? 'lab-cell' : ''} ${cellEditable ? 'clickable' : ''}`}
        style={{
          gridColumn: isLab ? 'span 2' : 'span 1',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'transparent',
          borderLeft: 'none'
        }}
        onClick={() => cellEditable && onCellClick?.(day, slot, renderableEntries[0])}
      >
        {renderableEntries.map((entry, idx) => {
          const color = getDeptColor(entry);
          return (
            <div 
              key={entry._id || idx}
              className="split-entry"
              style={{
                background: `${color}12`,
                borderLeft: `3px solid ${color}`,
                borderBottom: idx < renderableEntries.length - 1 ? '1px solid var(--border)' : 'none',
                flex: 1,
                padding: '0.4rem',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative'
              }}
              onMouseEnter={(e) => handleMouseEnter(e, entry)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="cell-subject" style={{ color }}>{entry.subject || 'No Subject'}</div>
              <div className="cell-faculty">{entry.faculty?.name || ''}</div>
              <div className="cell-info" style={{ fontSize: '0.65rem' }}>
                Year {entry.year} . {entry.batch ? `${entry.batch}` : entry.department?.name}
                {entry.section ? ` (${entry.section}${entry.subsection ? `-${entry.subsection}` : ''})` : ''}
              </div>
              {showClassroom && entry.classroom && (
                <div className="cell-classroom">{entry.classroom.name}</div>
              )}
              {entry.type === 'lab' && <span className="lab-badge">LAB</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="timetable-wrapper">
      <div className="timetable-grid">
        {/* Header row */}
        <div className="grid-header corner-cell">Day / Time</div>
        {timeSlots.map(t => (
          <div key={t.slot} className="grid-header time-header">{t.label}</div>
        ))}

        {/* Data rows */}
        {DAYS.map(day => {
          const cells = [];
          let skip = false;

          for (let s = 0; s < timeSlots.length; s++) {
            if (skip) {
              skip = false;
              continue;
            }
            const slotEntries = getEntries(day, s);
            if (slotEntries.some(e => e.type === 'lab' && !e.isSecondSlot)) {
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
            <strong>Batch:</strong> Year {tooltip.entry.year} . {tooltip.entry.batch || tooltip.entry.department?.name || 'N/A'}
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

export { DAYS };
export default TimetableGrid;
