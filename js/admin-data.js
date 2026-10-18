/* Shared admin data access and helpers. */
(() => {
  const STORAGE_KEY = 'campusly-student-data';
  const DATA_URL = 'data/students.json';
  let current = null;

  async function load() {
    if (current) return current;
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Could not load data/students.json. Start the project with Live Server.');
    const base = await response.json();
    const saved = localStorage.getItem(STORAGE_KEY);
    current = saved ? JSON.parse(saved) : base;
    current.subjects ||= base.subjects || [];
    current.students ||= [];
    current.students.forEach(student => { student.attendanceRecords ||= []; });
    return current;
  }

  function save(data) {
    current = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function summary(records = []) {
    const attended = records.filter(record => record.status === 'present').length;
    const conducted = records.length;
    return { conducted, attended, missed: conducted - attended, percentage: conducted ? attended / conducted * 100 : null };
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function exportJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'students.json'; link.click();
    URL.revokeObjectURL(url);
  }

  window.CampuslyAdminData = { load, save, summary, escape, exportJson };
})();
