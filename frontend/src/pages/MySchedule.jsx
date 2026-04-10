import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';
import TimetableGrid from '../components/TimetableGrid';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DAYS } from '../components/TimetableGrid';
import './MySchedule.css';

const MySchedule = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/common/my-schedule');
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedule(); }, []);

  useEffect(() => {
    const refresh = () => fetchSchedule();
    socket.on('timetable:created', refresh);
    socket.on('timetable:updated', refresh);
    socket.on('timetable:deleted', refresh);
    return () => {
      socket.off('timetable:created', refresh);
      socket.off('timetable:updated', refresh);
      socket.off('timetable:deleted', refresh);
    };
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`My Teaching Schedule - ${user?.name}`, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${user?.authId} · Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const timeLabels = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00'];
    const tableHead = [['Day', ...timeLabels]];
    const tableBody = DAYS.map(day => {
      const row = [day];
      for (let s = 0; s < 8; s++) {
        const e = entries.find(en => en.day === day && en.timeSlot === s && !en.isSecondSlot);
        if (e) {
          const batchSection = e.batch
            ? `${e.batch} (${e.section}${e.subsection ? '-' + e.subsection : ''})`
            : `${e.department?.name || ''} (${e.section}${e.subsection ? '-' + e.subsection : ''})`;
          const labNote = e.type === 'lab' ? ' [LAB]' : '';
          row.push(`${e.subject || '-'}\n${e.faculty?.name || ''}\n${batchSection}${labNote}`);
          if (e.type === 'lab') { s++; row.push('↔'); }
        } else {
          row.push('-');
        }
      }
      return row;
    });

    doc.autoTable({
      head: tableHead,
      body: tableBody,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 3, halign: 'center', valign: 'middle', lineWidth: 0.3 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', halign: 'left', fillColor: [238, 242, 255] } },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`schedule_${user?.name?.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) return <div className="loading-spinner"></div>;

  // Count classes
  const uniqueEntries = entries.filter(e => !e.isSecondSlot);
  const lectureCount = uniqueEntries.filter(e => e.type === 'lecture').length;
  const labCount = uniqueEntries.filter(e => e.type === 'lab').length;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Teaching Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            {lectureCount} lectures · {labCount} labs · {lectureCount + labCount} total classes/week
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExportPDF} id="btn-export-schedule">
          📄 Export PDF
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No classes assigned to you yet.</p>
        </div>
      ) : (
        <TimetableGrid
          entries={entries}
          canEdit={false}
          showClassroom={true}
        />
      )}
    </div>
  );
};

export default MySchedule;
