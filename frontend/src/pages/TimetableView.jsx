import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';
import TimetableGrid from '../components/TimetableGrid';
import FilterPanel from '../components/FilterPanel';
import EntryModal from '../components/EntryModal';
import AllotmentModal from '../components/AllotmentModal';
import { DAYS } from '../components/TimetableGrid';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './TimetableView.css';

const formatYear = (y) => {
  const n = Number(y);
  if (n === 1) return '1st Year';
  if (n === 2) return '2nd Year';
  if (n === 3) return '3rd Year';
  return `${n}th Year`;
};

const TimetableView = () => {
  const { user, systemSettings } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHod = user?.role === 'hod';
  const canEdit = isAdmin || isHod;
  const timeSlots = systemSettings?.timeSlots || Array.from({length: 8}, (_,i)=>({slot:i, label:`${i+9}:00`}));

  const [entries, setEntries] = useState([]);
  const [allotments, setAllotments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ classroom: '', department: '', faculty: '', year: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [allotModalOpen, setAllotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ day: '', timeSlot: 0 });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedAllotment, setSelectedAllotment] = useState(null);

  // View modes
  const isFacultyMode = !filters.classroom && !filters.department && filters.faculty;
  const isDeptMode = !filters.classroom && filters.department && !filters.faculty;

  const fetchEntries = useCallback(async () => {
    try {
      const params = {};
      if (filters.classroom) params.classroom = filters.classroom;
      if (filters.department) params.department = filters.department;
      if (filters.faculty) params.faculty = filters.faculty;
      const res = await api.get('/common/timetable', { params });
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    }
  }, [filters.classroom, filters.department, filters.faculty]);

  const fetchAllotments = useCallback(async () => {
    if (!filters.classroom) {
      setAllotments([]);
      return;
    }
    try {
      const res = await api.get('/common/allotments', { params: { classroom: filters.classroom } });
      setAllotments(res.data);
    } catch (err) {
      console.error('Failed to fetch allotments', err);
    }
  }, [filters.classroom]);

  const fetchMeta = async () => {
    try {
      const [cr, dp, fc] = await Promise.all([
        api.get('/common/classrooms'),
        api.get('/common/departments'),
        api.get('/common/faculty')
      ]);
      setClassrooms(cr.data);
      setDepartments(dp.data);
      setFaculty(fc.data);

      if (cr.data.length > 0 && !filters.classroom) {
        setFilters(f => ({ ...f, classroom: cr.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchEntries().finally(() => setLoading(false)); }, [fetchEntries]);
  useEffect(() => { fetchAllotments(); }, [fetchAllotments]);

  useEffect(() => {
    const refresh = () => { fetchEntries(); fetchAllotments(); };
    socket.on('timetable:created', refresh);
    socket.on('timetable:updated', refresh);
    socket.on('timetable:deleted', refresh);
    socket.on('allotment:updated', refresh);
    socket.on('allotment:deleted', refresh);
    return () => {
      socket.off('timetable:created', refresh);
      socket.off('timetable:updated', refresh);
      socket.off('timetable:deleted', refresh);
      socket.off('allotment:updated', refresh);
      socket.off('allotment:deleted', refresh);
    };
  }, [fetchEntries, fetchAllotments]);

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({ classroom: classrooms[0]?._id || '', department: '', faculty: '', year: '' });
    } else {
      setFilters(f => ({ ...f, [key]: value }));
    }
  };

  const handleCellClick = (day, timeSlot, entry = null) => {
    if (!canEdit) return;
    if (isHod && entry && entry.department?._id !== user.department?._id) return;
    setSelectedSlot({ day, timeSlot });
    setSelectedEntry(entry);
    setModalOpen(true);
  };

  const handleAllotClick = (day, timeSlot, existingAllotment = null) => {
    if (!isAdmin) return;
    setSelectedSlot({ day, timeSlot });
    setSelectedAllotment(existingAllotment);
    setAllotModalOpen(true);
  };

  const handleAllotSave = async (day, timeSlot, departmentId) => {
    await api.post('/admin/allotments', {
      classroom: filters.classroom,
      day,
      timeSlot,
      department: departmentId
    });
    fetchAllotments();
  };

  const handleAllotRemove = async (allotmentId) => {
    await api.delete(`/admin/allotments/${allotmentId}`);
    fetchAllotments();
  };

  // ─── PDF HELPERS ───

  const buildPdfRow = (day, entryList) => {
    const row = [day];
    for (let s = 0; s < timeSlots.length; s++) {
      const slotEntries = entryList.filter(en => en.day === day && en.timeSlot === s && !en.isSecondSlot);
      if (slotEntries.length > 0) {
        // If there are multiple entries for a single slot, join them with a dashed line
        const cellText = slotEntries.map(e => {
          const batchSection = e.batch
            ? `${formatYear(e.year)} ${e.batch} (${e.section}${e.subsection ? '-' + e.subsection : ''})`
            : `${formatYear(e.year)} ${e.department?.name || ''} (${e.section}${e.subsection ? '-' + e.subsection : ''})`;
          const labNote = e.type === 'lab' ? ' [LAB]' : '';
          return `${e.subject || '-'}\n${e.faculty?.name || ''}\n${batchSection}${labNote}`;
        }).join('\n-----------------------\n');
        
        const isLab = slotEntries.some(e => e.type === 'lab');
        if (isLab) { 
          s++; // skip next slot
          row.push({ content: cellText, colSpan: 2 });
        } else {
          row.push({ content: cellText });
        }
      } else {
        row.push('-');
      }
    }
    return row;
  };

  const addTimetableToDoc = (doc, title, entryList, startY) => {
    const timeLabels = timeSlots.map(t => t.label);
    const tableHead = [['Day', ...timeLabels]];
    const tableBody = DAYS.map(day => buildPdfRow(day, entryList));

    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(title, 14, startY);

    doc.autoTable({
      head: tableHead,
      body: tableBody,
      startY: startY + 4,
      styles: { fontSize: 6, cellPadding: 2.5, halign: 'center', valign: 'middle', lineWidth: 0.3 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', halign: 'left', fillColor: [238, 242, 255] } },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    return doc.lastAutoTable.finalY + 8;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');

    if (isDeptMode) {
      // Department mode — multiple batch tables
      const dept = departments.find(d => d._id === filters.department);
      const deptName = dept?.name || 'Department';
      const yearLabel = filters.year ? `Year ${filters.year}` : 'All Years';

      doc.setFontSize(16);
      doc.text(`Department Timetable — ${deptName} (${dept?.fullName || ''})`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${yearLabel} · Generated: ${new Date().toLocaleDateString()}`, 14, 22);

      const batchGroups = getBatchGroups();
      let currentY = 30;

      batchGroups.forEach((group, idx) => {
        if (currentY > 160) {
          doc.addPage();
          currentY = 15;
        }
        currentY = addTimetableToDoc(doc, `${group.label}`, group.entries, currentY);
      });

      doc.save(`dept_timetable_${deptName}_${yearLabel.replace(/\s+/g, '_')}.pdf`);

    } else if (isFacultyMode) {
      const fac = faculty.find(f => f._id === filters.faculty);
      doc.setFontSize(16);
      doc.text(`Personal Timetable - ${fac?.name || 'Faculty'}`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
      addTimetableToDoc(doc, '', entries, 26);
      doc.save(`timetable_${(fac?.name || 'faculty').replace(/\s+/g, '_')}.pdf`);

    } else {
      const classroomName = classrooms.find(c => c._id === filters.classroom)?.name || 'Classroom';
      doc.setFontSize(16);
      doc.text(`Timetable - ${classroomName}`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
      addTimetableToDoc(doc, '', entries, 26);
      doc.save(`timetable_${classroomName.replace(/\s+/g, '_')}.pdf`);
    }
  };

  // ─── DEPT MODE: group entries by batch+section ───

  const getBatchGroups = () => {
    const dept = departments.find(d => d._id === filters.department);
    if (!dept) return [];

    const yearFilter = filters.year ? Number(filters.year) : null;
    const filtered = yearFilter
      ? entries.filter(e => e.year === yearFilter)
      : entries;

    // Build groups from department batches structure
    const groups = [];

    if (dept.batches && dept.batches.length > 0) {
      dept.batches.forEach(batch => {
        const batchSections = batch.sections || [];
        if (batchSections.length > 0) {
          batchSections.forEach(sec => {
            const label = `${batch.name} (${sec.name})`;
            const sectionEntries = filtered.filter(e =>
              e.batch === batch.name && e.section === sec.name
            );
            if (sectionEntries.length > 0 || true) { // always show even if empty
              groups.push({ label, batchName: batch.name, section: sec.name, entries: sectionEntries });
            }
          });
        } else {
          // Batch with no sections — show all entries for that batch
          const batchEntries = filtered.filter(e => e.batch === batch.name);
          groups.push({ label: batch.name, batchName: batch.name, section: null, entries: batchEntries });
        }
      });
    }

    // Also pick up entries that don't match any defined batch (fallback — section-only)
    const unmatchedEntries = filtered.filter(e => {
      if (!dept.batches || dept.batches.length === 0) return true;
      return !dept.batches.some(b => b.name === e.batch);
    });

    if (unmatchedEntries.length > 0) {
      // Group unmatched by section
      const sectionMap = {};
      unmatchedEntries.forEach(e => {
        const key = e.section || 'Unknown';
        if (!sectionMap[key]) sectionMap[key] = [];
        sectionMap[key].push(e);
      });
      Object.entries(sectionMap).forEach(([sec, ents]) => {
        groups.push({ label: `${dept.name} (${sec})`, batchName: dept.name, section: sec, entries: ents });
      });
    }

    return groups;
  };

  if (loading) return <div className="loading-spinner"></div>;

  const showGrid = filters.classroom || isFacultyMode;
  const showDeptMode = isDeptMode;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          {isDeptMode ? 'Department Timetable' : isFacultyMode ? 'Faculty Timetable' : 'Timetable'}
        </h1>
        {!isFacultyMode && !isDeptMode && classrooms.length > 0 && filters.classroom && (
          <span className="current-classroom">
            📍 {classrooms.find(c => c._id === filters.classroom)?.name}
          </span>
        )}
        {isFacultyMode && (
          <span className="current-classroom">
            👤 {faculty.find(f => f._id === filters.faculty)?.name}
          </span>
        )}
        {isDeptMode && (
          <span className="current-classroom" style={{ background: 'var(--success-light, #ecfdf5)', color: '#059669' }}>
            🏛️ {departments.find(d => d._id === filters.department)?.name}
            {filters.year && ` · Year ${filters.year}`}
          </span>
        )}
      </div>

      <FilterPanel
        classrooms={classrooms}
        departments={departments}
        faculty={faculty}
        filters={filters}
        onFilterChange={handleFilterChange}
        onExport={(showGrid || (showDeptMode && filters.year)) ? handleExportPDF : null}
        showFacultyMode={isAdmin || isHod}
        showYearFilter={true}
      />

      {/* ─── CLASSROOM MODE ─── */}
      {!isDeptMode && !isFacultyMode && (
        <>
          {classrooms.length === 0 ? (
            <div className="empty-state">
              <p>No classrooms found. An admin needs to create classrooms first.</p>
            </div>
          ) : !filters.classroom ? (
            <div className="empty-state">
              <p>Please select a classroom to view its timetable, or use other filter combinations for faculty/department views.</p>
            </div>
          ) : (
            <TimetableGrid
              entries={entries}
              allotments={allotments}
              onCellClick={handleCellClick}
              onAllotClick={handleAllotClick}
              canEdit={canEdit}
              isAdmin={isAdmin}
              isHod={isHod}
              hodDepartmentId={user?.department?._id}
              showClassroom={false}
            />
          )}
        </>
      )}

      {/* ─── FACULTY MODE ─── */}
      {isFacultyMode && (
        <TimetableGrid
          entries={entries}
          canEdit={false}
          showClassroom={true}
        />
      )}

      {/* ─── DEPARTMENT MODE — Multiple batch grids ─── */}
      {isDeptMode && (
        <div className="dept-timetable-list">
          {!filters.year ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📅</div>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>Select a Year</p>
              <p style={{ marginTop: '0.3rem' }}>Please choose a year from the filter above to view department timetables.</p>
            </div>
          ) : (() => {
            const groups = getBatchGroups();
            if (groups.length === 0) {
              return (
                <div className="empty-state">
                  <p>No batches/sections defined for this department, or no entries found.</p>
                </div>
              );
            }
            return groups.map((group, idx) => (
              <div key={idx} className="dept-batch-block">
                <h3 className="dept-batch-title">
                  <span className="dept-batch-icon">📋</span>
                  {group.label}
                </h3>
                <TimetableGrid
                  entries={group.entries}
                  canEdit={false}
                  showClassroom={true}
                />
              </div>
            ));
          })()}
        </div>
      )}

      <EntryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEntry(null); }}
        day={selectedSlot.day}
        timeSlot={selectedSlot.timeSlot}
        classroomId={filters.classroom}
        existingEntry={selectedEntry}
        departments={departments}
        onSaved={fetchEntries}
      />

      <AllotmentModal
        isOpen={allotModalOpen}
        onClose={() => { setAllotModalOpen(false); setSelectedAllotment(null); }}
        day={selectedSlot.day}
        timeSlot={selectedSlot.timeSlot}
        departments={departments}
        existingAllotment={selectedAllotment}
        onSave={handleAllotSave}
        onRemove={handleAllotRemove}
      />
    </div>
  );
};

export default TimetableView;
