import './FilterPanel.css';

const FilterPanel = ({
  classrooms, departments, faculty, filters, onFilterChange, onExport,
  showFacultyMode = false,
  showYearFilter = false,
  years = [1, 2, 3, 4]
}) => {
  const isFacultyMode = showFacultyMode && !filters.classroom && !filters.department && filters.faculty;
  const isDeptMode = !filters.classroom && filters.department && !filters.faculty;

  return (
    <div className="filter-panel" id="filter-panel">
      <div className="filter-group">
        <label htmlFor="filter-classroom">Classroom</label>
        <select
          id="filter-classroom"
          value={filters.classroom || ''}
          onChange={(e) => onFilterChange('classroom', e.target.value)}
        >
          <option value="">All Classrooms</option>
          {classrooms.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-department">Department</label>
        <select
          id="filter-department"
          value={filters.department || ''}
          onChange={(e) => onFilterChange('department', e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d._id} value={d._id}>{d.name} - {d.fullName}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-faculty">Faculty</label>
        <select
          id="filter-faculty"
          value={filters.faculty || ''}
          onChange={(e) => onFilterChange('faculty', e.target.value)}
        >
          <option value="">All Faculty</option>
          {faculty.map(f => (
            <option key={f._id} value={f._id}>{f.name} ({f.authId})</option>
          ))}
        </select>
      </div>

      {/* Year filter — shown in dept mode */}
      {showYearFilter && isDeptMode && (
        <div className="filter-group">
          <label htmlFor="filter-year">Year</label>
          <select
            id="filter-year"
            value={filters.year || ''}
            onChange={(e) => onFilterChange('year', e.target.value)}
          >
            <option value="">All Years</option>
            {years.map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
      )}

      {isFacultyMode && (
        <div className="filter-mode-badge">
          👤 Faculty Personal Timetable
        </div>
      )}

      {isDeptMode && (
        <div className="filter-mode-badge dept-mode">
          🏛️ Department Timetable
        </div>
      )}

      <div className="filter-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onFilterChange('reset')}
          id="btn-clear-filters"
        >
          Clear
        </button>
        {onExport && (
          <button className="btn btn-primary btn-sm" onClick={onExport} id="btn-export-pdf">
            📄 Export PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
