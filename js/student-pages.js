// Shared data and interactions for the standalone Subjects, History, and Planner pages.
(() => {
  const DATA_URL = 'data/students.json';
  const DATA_KEY = 'campusly-student-data';
  const LOGIN_KEY = 'campusly-login-id';
  const AUTH_KEY = 'campusly-authenticated';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const summary = records => {
    const attended = records.filter(record => record.status === 'present').length;
    const conducted = records.length;
    return { conducted, attended, missed: conducted - attended, percentage: conducted ? attended / conducted * 100 : null };
  };
  const requiredClasses = (stats, target) => {
    if (!stats.conducted || stats.percentage === null || stats.percentage >= target) return 0;
    return Math.max(0, Math.ceil((target * stats.conducted - 100 * stats.attended) / (100 - target)));
  };

  function setHeader(profile) {
    const avatar = document.getElementById('pageAvatar');
    avatar.textContent = profile.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const studentLine = document.getElementById('pageStudentLine');
    if (studentLine) studentLine.textContent = 'Attendance details for your current semester.';
    document.getElementById('pageLogout').addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(LOGIN_KEY);
      window.location.href = 'index.html';
    });
  }

  function statusFor(percentage, target) {
    if (percentage === null) return { label: 'No data', cls: 'warning', color: '#945c12' };
    if (percentage >= target) return { label: 'Safe', cls: 'safe', color: '#18704f' };
    if (percentage >= target - 5) return { label: 'Warning', cls: 'warning', color: '#945c12' };
    return { label: 'Low attendance', cls: 'low', color: '#a33442' };
  }

  function renderSubjects(profile, subjects, records) {
    const target = profile.target || 75;
    const stats = subjects.map(subject => ({ subject, summary: summary(records.filter(record => record.subjectId === subject.id)) }));
    const total = summary(records);
    const below = stats.filter(item => item.summary.percentage !== null && item.summary.percentage < target).length;
    document.getElementById('subjectSummary').innerHTML = `<div class="subject-summary-stat"><span>CLASSES CONDUCTED</span><strong>${total.conducted}</strong></div><div class="subject-summary-stat"><span>CLASSES ATTENDED</span><strong>${total.attended}</strong></div><div class="subject-summary-stat"><span>OVERALL ATTENDANCE</span><strong>${total.percentage === null ? '—' : `${Math.round(total.percentage)}%`}</strong></div><div class="subject-summary-stat"><span>SUBJECTS BELOW TARGET</span><strong>${below}</strong></div>`;
    const grid = document.getElementById('pageSubjectGrid');
    if (!subjects.length) {
      grid.innerHTML = '<div class="empty-state">Subject attendance is not available yet.</div>';
      return;
    }
    grid.innerHTML = stats.map(({ subject, summary: item }) => {
      const state = statusFor(item.percentage, target);
      const needed = requiredClasses(item, target);
      const alert = item.percentage !== null && item.percentage < target
        ? `<div class="subject-alert">${item.missed} class${item.missed === 1 ? '' : 'es'} missed · attend ${needed} consecutive class${needed === 1 ? '' : 'es'} to reach ${target}%</div>` : '';
      return `<a class="subject-card subject-card-link" href="subject.html?id=${encodeURIComponent(subject.id)}" aria-label="View attendance details for ${escapeHtml(subject.name)}"><div class="subject-top"><div><div class="subject-name">${escapeHtml(subject.name)}</div><div class="subject-code">${escapeHtml(subject.code)}</div></div><span class="status-pill ${state.cls}">${state.label}</span></div><div class="subject-percentage-row"><strong class="subject-percentage" style="color:${state.color}">${item.percentage === null ? '—' : `${Math.round(item.percentage)}%`}</strong><span class="subject-percentage-label">attendance</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(item.percentage || 0, 100)}%;background:${state.color}"></div></div><div class="subject-stats"><span><strong>${item.attended}</strong> attended</span><span><strong>${item.missed}</strong> missed</span><span><strong>${item.conducted}</strong> conducted</span></div>${alert}<span class="subject-card-open">View class records <span aria-hidden="true">→</span></span></a>`;
    }).join('');
  }

  function renderHistory(subjects, records) {
    const subjectFilter = document.getElementById('pageSubjectFilter');
    const statusFilter = document.getElementById('pageStatusFilter');
    subjectFilter.innerHTML = '<option value="all">All subjects</option>' + subjects.map(subject => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`).join('');
    const render = () => {
      const subjectNames = new Map(subjects.map(subject => [subject.id, subject.name]));
      const filtered = records.filter(record => (subjectFilter.value === 'all' || subjectFilter.value === record.subjectId) && (statusFilter.value === 'all' || statusFilter.value === record.status)).sort((a, b) => b.date.localeCompare(a.date));
      document.getElementById('pageRecordCount').textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;
      document.getElementById('pageHistorySummary').textContent = filtered.length ? `Showing all ${filtered.length} matching records` : 'No records to show';
      document.getElementById('pageHistoryEmpty').hidden = filtered.length > 0;
      document.querySelector('.standalone-history-panel .history-table').hidden = filtered.length === 0;
      document.getElementById('pageHistoryBody').innerHTML = filtered.map(record => {
        const date = new Date(`${record.date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const label = record.status === 'present' ? 'Present' : 'Absent';
        return `<tr><td>${date}</td><td>${escapeHtml(subjectNames.get(record.subjectId) || 'Unknown subject')}</td><td><span class="history-status ${record.status}"><i class="status-dot"></i>${label}</span></td></tr>`;
      }).join('');
    };
    subjectFilter.addEventListener('change', render);
    statusFilter.addEventListener('change', render);
    document.getElementById('resetHistoryFilters').addEventListener('click', () => { subjectFilter.value = 'all'; statusFilter.value = 'all'; render(); });
    document.getElementById('downloadHistory').addEventListener('click', () => {
      const rows = [['Date', 'Subject', 'Status'], ...records.map(record => [record.date, subjectNames.get(record.subjectId) || 'Unknown subject', record.status])];
      const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'attendance-history.csv'; link.click(); URL.revokeObjectURL(url);
    });
    render();
  }

  function renderPlanner(profile, subjects, records) {
    const select = document.getElementById('pagePlannerSubject');
    select.innerHTML = '<option value="overall">Overall attendance</option>' + subjects.map(subject => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`).join('');
    const target = profile.target || 75;
    const overall = summary(records);
    const subjectMap = new Map(subjects.map(subject => [subject.id, subject]));
    const update = () => {
      const id = select.value;
      const stats = id === 'overall' ? overall : summary(records.filter(record => record.subjectId === id));
      const name = id === 'overall' ? 'Overall attendance' : subjectMap.get(id)?.name || 'Selected subject';
      const result = document.getElementById('pagePlannerResult');
      result.classList.remove('success', 'empty');
      if (!stats.conducted || stats.percentage === null) {
        document.getElementById('pageRequiredClasses').textContent = '—';
        document.getElementById('pageResultTitle').textContent = 'No attendance data';
        document.getElementById('pageResultDescription').textContent = `There are no records yet for ${name.toLowerCase()}.`;
        result.classList.add('empty');
      } else {
        const required = requiredClasses(stats, target);
        if (required === 0) {
          document.getElementById('pageRequiredClasses').textContent = '✓';
          document.getElementById('pageResultTitle').textContent = 'Target achieved!';
          document.getElementById('pageResultDescription').textContent = `${name} is at ${Math.round(stats.percentage)}%. Keep attending to stay on track.`;
          result.classList.add('success');
        } else {
          document.getElementById('pageRequiredClasses').textContent = required;
          document.getElementById('pageResultTitle').textContent = `consecutive class${required === 1 ? '' : 'es'}`;
          document.getElementById('pageResultDescription').textContent = `Attend the next ${required} ${required === 1 ? 'class' : 'classes'} in ${name} to reach ${target}%.`;
        }
      }
      document.getElementById('plannerEncouragement').textContent = overall.percentage === null
        ? 'Once attendance records are available, this planner will help you decide how to get back on track.'
        : overall.percentage >= target
          ? `You are currently at ${Math.round(overall.percentage)}% overall. Keep attending regularly to maintain your progress.`
          : `Your overall attendance is ${Math.round(overall.percentage)}%. Use the plan above and attend every upcoming class to improve it.`;
    };
    select.addEventListener('change', update);
    update();
  }

  function renderSubjectDetail(profile, subjects, records) {
    const subjectId = new URLSearchParams(window.location.search).get('id');
    const subject = subjects.find(item => item.id === subjectId);
    if (!subject) {
      document.getElementById('subjectDetailName').textContent = 'Subject not found';
      document.getElementById('subjectDetailCode').textContent = 'Choose a subject from the subject overview.';
      document.getElementById('subjectRecordsEmpty').hidden = false;
      document.getElementById('subjectRecordsEmpty').textContent = 'This subject is not available.';
      document.getElementById('subjectRecordTable').hidden = true;
      return;
    }
    const target = profile.target || 75;
    const subjectRecords = records.filter(record => record.subjectId === subject.id).sort((a, b) => b.date.localeCompare(a.date));
    const stats = summary(subjectRecords);
    const state = statusFor(stats.percentage, target);
    document.title = `${subject.name} attendance | Campusly`;
    document.getElementById('subjectDetailName').textContent = subject.name;
    document.getElementById('subjectDetailCode').textContent = `${subject.code} · Subject attendance details`;
    document.getElementById('subjectDetailSummary').innerHTML = `<article class="subject-detail-stat subject-percent-stat"><span>ATTENDANCE PERCENTAGE</span><strong style="color:${state.color}">${stats.percentage === null ? '—' : `${Math.round(stats.percentage)}%`}</strong><span class="status-pill ${state.cls}">${state.label}</span></article><article class="subject-detail-stat"><span>TOTAL CLASSES</span><strong>${stats.conducted}</strong></article><article class="subject-detail-stat"><span>CLASSES ATTENDED</span><strong>${stats.attended}</strong></article><article class="subject-detail-stat"><span>CLASSES MISSED</span><strong>${stats.missed}</strong></article>`;
    document.getElementById('subjectRecordCount').textContent = `${subjectRecords.length} record${subjectRecords.length === 1 ? '' : 's'}`;
    document.getElementById('subjectRecordBody').innerHTML = subjectRecords.map(record => {
      const date = new Date(`${record.date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const label = record.status === 'present' ? 'Present' : 'Absent';
      return `<tr><td>${date}</td><td><span class="history-status ${record.status}"><i class="status-dot"></i>${label}</span></td></tr>`;
    }).join('');
    document.getElementById('subjectRecordsEmpty').hidden = subjectRecords.length > 0;
    document.getElementById('subjectRecordTable').hidden = subjectRecords.length === 0;
  }
  async function start() {
    if (sessionStorage.getItem(AUTH_KEY) !== 'true' || !sessionStorage.getItem(LOGIN_KEY)) {
      window.location.replace('index.html');
      return;
    }
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Could not load student data. Open this project with VS Code Live Server.');
    const base = await response.json();
    const data = JSON.parse(localStorage.getItem(DATA_KEY) || 'null') || base;
    const account = data.students.find(item => item.loginId === sessionStorage.getItem(LOGIN_KEY));
    if (!account) { sessionStorage.removeItem(AUTH_KEY); window.location.replace('index.html'); return; }
    const records = account.attendanceRecords || [];
    setHeader(account.profile);
    if (document.getElementById('pageSubjectGrid')) renderSubjects(account.profile, data.subjects || [], records);
    if (document.getElementById('subjectDetailSummary')) renderSubjectDetail(account.profile, data.subjects || [], records);
    if (document.getElementById('pageHistoryBody')) renderHistory(data.subjects || [], records);
    if (document.getElementById('pagePlannerSubject')) renderPlanner(account.profile, data.subjects || [], records);
  }

  start().catch(error => {
    const line = document.getElementById('pageStudentLine');
    if (line) line.textContent = error.message;
  });
})();





