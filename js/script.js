// Campusly attendance dashboard
// Student accounts and attendance records load from data/students.json.
const SESSION_KEY = 'campusly-authenticated';
const LOGIN_DATA_URL = 'data/students.json';
let students = [];
let student = null;
let subjects = [];
let attendanceRecords = [];
let subjectById = new Map();
let subjectStats = new Map();
let overall = { conducted: 0, attended: 0, missed: 0, percentage: null };

// Calculate totals and reusable values from attendance records.
const statsFor = records => {
  const conducted = records.length;
  const attended = records.filter(record => record.status === 'present').length;
  return {
    conducted,
    attended,
    missed: conducted - attended,
    percentage: conducted ? (attended / conducted) * 100 : null
  };
};
const rounded = value => Math.round(value);
const initials = name => name
  ? name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  : '—';
const statusFor = percentage => {
  if (!student) {
    return { label: 'No data', className: 'warning', color: 'var(--orange)' };
  }
  if (percentage >= student.target) {
    return { label: 'Safe', className: 'safe', color: 'var(--green)' };
  }
  if (percentage >= student.target - 5) {
    return { label: 'Warning', className: 'warning', color: 'var(--orange)' };
  }
  return { label: 'Low attendance', className: 'low', color: 'var(--red)' };
};

// Student profile and dashboard summary
function populateStudent() {
  const profile = student || {};
  document.getElementById('todayDate').textContent = new Date()
    .toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    .toUpperCase();
  document.getElementById('welcomeName').textContent = profile.name ? profile.name.split(' ')[0] : 'there';
  document.getElementById('studentFullName').textContent = profile.name || 'Student name unavailable';
  document.getElementById('studentCourse').textContent = profile.course || 'Course details unavailable';
  document.getElementById('rollNumber').textContent = profile.rollNumber || 'Not available';
  document.getElementById('yearSemester').textContent = profile.year && profile.semester ? `${profile.year} · ${profile.semester}` : 'Not available';
  document.getElementById('division').textContent = profile.division || '—';
  ['studentAvatar', 'topAvatar'].forEach(id => { document.getElementById(id).textContent = initials(profile.name); });
}

function renderOverview() {
  const percent = overall.percentage;
  const target = student?.target || 75;
  document.getElementById('overallPercent').textContent = percent === null ? '—' : `${rounded(percent)}%`;
  document.getElementById('overallProgress').style.width = `${Math.min(percent || 0, 100)}%`;
  document.getElementById('overallProgress').style.background = percent !== null && percent < target ? 'var(--red)' : '#6072e9';
  document.getElementById('totalClasses').textContent = overall.conducted;
  document.getElementById('attendedClasses').textContent = overall.attended;
  document.getElementById('missedClasses').textContent = overall.missed;
  document.getElementById('overallStatus').textContent = percent === null ? 'No records yet' : `${rounded(percent)}% attendance`;
  document.getElementById('overallMessage').textContent = percent === null ? 'No attendance records are available yet.' : percent >= target ? 'You’re meeting the minimum attendance target.' : `You’re ${rounded(target - percent)} points below the ${target}% target.`;
  document.getElementById('overallTargetText').textContent = `${target}% target`;
}

// Subject cards and attendance recovery alerts
function renderSubjects() {
  const grid = document.getElementById('subjectGrid');
  if (!subjects.length) {
    grid.innerHTML = '<div class="empty-state subject-empty">Subject attendance will appear here when your records are connected.</div>';
    document.getElementById('subjectCount').textContent = '0';
    return;
  }

  grid.innerHTML = subjects.map(subject => {
    const stats = subjectStats.get(subject.id);
    const percent = stats.percentage;
    const target = student?.target || 75;
    const status = percent === null
      ? { label: 'No data', className: 'warning', color: 'var(--orange)' }
      : statusFor(percent);
    const classesNeeded = requiredToTarget(stats, target);
    const alert = percent !== null && percent < target
      ? `<div class="subject-alert">
          ${stats.missed} class${stats.missed === 1 ? '' : 'es'} missed · attend
          ${classesNeeded} consecutive class${classesNeeded === 1 ? '' : 'es'} to reach ${target}%
        </div>`
      : '';

    return `
      <article class="subject-card">
        <div class="subject-top">
          <div>
            <div class="subject-name">${subject.name}</div>
            <div class="subject-code">${subject.code}</div>
          </div>
          <span class="status-pill ${status.className}">${status.label}</span>
        </div>
        <div class="subject-percentage-row">
          <strong class="subject-percentage" style="color:${status.color}">
            ${percent === null ? '—' : `${rounded(percent)}%`}
          </strong>
          <span class="subject-percentage-label">attendance</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(percent || 0, 100)}%;background:${status.color}"></div>
        </div>
        <div class="subject-stats">
          <span><strong>${stats.attended}</strong> attended</span>
          <span><strong>${stats.missed}</strong> missed</span>
          <span><strong>${stats.conducted}</strong> conducted</span>
        </div>
        ${alert}
      </article>`;
  }).join('');
  document.getElementById('subjectCount').textContent = subjects.length;
}

// Minimum consecutive classes needed to meet the attendance target
function requiredToTarget(stats, target) {
  if (!stats.conducted || stats.percentage === null || stats.percentage >= target) return 0;
  // (attended + x) / (conducted + x) >= target/100
  return Math.max(0, Math.ceil((target * stats.conducted - 100 * stats.attended) / (100 - target)));
}

// Filtered and paginated class history
let visibleRecordLimit = 8;
function renderHistory() {
  const subjectFilter = document.getElementById('subjectFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const filtered = attendanceRecords
    .filter(record => (subjectFilter === 'all' || record.subjectId === subjectFilter)
      && (statusFilter === 'all' || record.status === statusFilter))
    .sort((first, second) => second.date.localeCompare(first.date));
  const shown = filtered.slice(0, visibleRecordLimit);
  const body = document.getElementById('historyBody');
  body.innerHTML = shown.map(record => {
    const subject = subjectById.get(record.subjectId);
    const date = new Date(`${record.date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const label = record.status === 'present' ? 'Present' : 'Absent';
    return `
      <tr>
        <td>${date}</td>
        <td>${subject ? subject.name : 'Unknown subject'}</td>
        <td>
          <span class="history-status ${record.status}">
            <i class="status-dot"></i>${label}
          </span>
        </td>
      </tr>`;
  }).join('');
  document.getElementById('emptyHistory').hidden = shown.length > 0;
  document.querySelector('.history-table').hidden = shown.length === 0;
  document.getElementById('recordCount').textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;
  document.getElementById('historySummary').textContent = filtered.length ? `Showing ${shown.length} of ${filtered.length} records` : 'No records to show';
  const moreButton = document.getElementById('showMoreButton');
  moreButton.hidden = filtered.length <= visibleRecordLimit;
  moreButton.innerHTML = 'Show more <span>⌄</span>';
  moreButton.disabled = visibleRecordLimit >= filtered.length;
  moreButton.style.opacity = moreButton.disabled ? '.45' : '1';
}

// Subject filter and planner options
function populateSelects() {
  const options = subjects.map(subject => `<option value="${subject.id}">${subject.name}</option>`).join('');
  const subjectFilter = document.getElementById('subjectFilter');
  const calculatorSubject = document.getElementById('calculatorSubject');
  subjectFilter.innerHTML = '<option value="all">All subjects</option>';
  calculatorSubject.innerHTML = '<option value="overall">Overall attendance</option>';
  subjectFilter.insertAdjacentHTML('beforeend', options);
  calculatorSubject.insertAdjacentHTML('beforeend', options);
}

// Attendance recovery planner
function renderCalculator() {
  const id = document.getElementById('calculatorSubject').value;
  const stats = id === 'overall' ? overall : subjectStats.get(id);
  const name = id === 'overall' ? 'Overall attendance' : subjectById.get(id)?.name || 'Selected subject';
  const result = document.getElementById('plannerResult');
  const number = document.getElementById('requiredClasses');
  const title = document.getElementById('resultTitle');
  const description = document.getElementById('resultDescription');
  result.classList.remove('success', 'empty');
  if (!stats || stats.conducted === 0 || stats.percentage === null) {
    number.textContent = '—';
    title.textContent = 'No attendance data';
    description.textContent = `There are no records yet for ${name.toLowerCase()}.`;
    result.classList.add('empty');
    return;
  }
  const required = requiredToTarget(stats, student.target);
  if (required === 0) {
    number.textContent = '✓';
    title.textContent = 'Target achieved!';
    description.textContent = `${name} is at ${rounded(stats.percentage)}%. Keep attending to stay on track.`;
    result.classList.add('success');
  } else {
    number.textContent = required;
    title.textContent = `consecutive class${required === 1 ? '' : 'es'}`;
    description.textContent = `Attend the next ${required} ${required === 1 ? 'class' : 'classes'} in ${name} to reach ${student.target}%.`;
  }
}

// Download a CSV report of the connected records
function downloadReport() {
  const profile = student || {};
  const lines = [
    'Campusly — Student attendance report', `Student: ${profile.name || ''}`, `Roll number: ${profile.rollNumber || ''}`,
    `Course: ${profile.course || ''}`, `Year: ${profile.year || ''} | ${profile.semester || ''} | Division ${profile.division || ''}`,
    `Overall attendance: ${overall.percentage === null ? 'No data' : `${rounded(overall.percentage)}%`}`,
    `Classes conducted: ${overall.conducted}`, `Classes attended: ${overall.attended}`, `Classes missed: ${overall.missed}`, '',
    'Subject,Code,Conducted,Attended,Missed,Attendance (%)',
    ...subjects.map(subject => { const stat = subjectStats.get(subject.id); return `"${subject.name}",${subject.code},${stat.conducted},${stat.attended},${stat.missed},${stat.percentage === null ? 'N/A' : rounded(stat.percentage)}`; }), '',
    'Date,Subject,Status', ...attendanceRecords.map(record => `${record.date},"${subjectById.get(record.subjectId)?.name || ''}",${record.status}`)
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'student-attendance-report.csv'; link.click(); URL.revokeObjectURL(link.href);
}

// Apply one selected student's profile and attendance records to the dashboard.
function displayStudent(account) {
  student = account?.profile || null;
  attendanceRecords = account?.attendanceRecords || [];
  subjectById = new Map(subjects.map(subject => [subject.id, subject]));
  subjectStats = new Map(subjects.map(subject => [
    subject.id,
    statsFor(attendanceRecords.filter(record => record.subjectId === subject.id))
  ]));
  overall = statsFor(attendanceRecords);

  populateStudent();
  populateSelects();
  renderOverview();
  renderSubjects();
  renderHistory();
  renderCalculator();
}

// Load student accounts from the JSON file and restore the selected session, if any.
async function loadStudentData() {
  const notice = document.getElementById('dataLoadNotice');
  try {
    const response = await fetch(LOGIN_DATA_URL);
    if (!response.ok) throw new Error('Student data file could not be loaded.');
    const data = await response.json();
    const savedData = localStorage.getItem('campusly-student-data');
    const source = savedData ? JSON.parse(savedData) : data;
    students = source.students || data.students;
    subjects = source.subjects || data.subjects;

    const savedLoginId = sessionStorage.getItem('campusly-login-id');
    const savedAccount = students.find(account => account.loginId === savedLoginId);
    if (sessionStorage.getItem(SESSION_KEY) === 'true' && savedAccount) {
      displayStudent(savedAccount);
      document.body.classList.add('authenticated');
    } else if (students.length) {
      displayStudent(students[0]);
      document.body.classList.remove('authenticated');
    } else {
      displayStudent(null);
      document.body.classList.remove('authenticated');
      notice.textContent = 'No student accounts are available. Add an account from the administrator console.';
      notice.hidden = false;
      document.getElementById('loginSubmit').disabled = true;
    }
    if (students.length) notice.hidden = true;
  } catch (error) {
    notice.textContent = 'Could not load student accounts. Open this project with VS Code Live Server.';
    notice.hidden = false;
    document.getElementById('loginSubmit').disabled = true;
  }
}

// Start with an empty-safe render until the JSON data arrives.
populateStudent();
populateSelects();
renderOverview();
renderSubjects();
renderHistory();
renderCalculator();
loadStudentData();
document.getElementById('subjectFilter').addEventListener('change', () => {
  visibleRecordLimit = 8;
  renderHistory();
});
document.getElementById('statusFilter').addEventListener('change', () => {
  visibleRecordLimit = 8;
  renderHistory();
});
document.getElementById('calculatorSubject').addEventListener('change', renderCalculator);
document.getElementById('clearFilters').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('subjectFilter').value = 'all';
  document.getElementById('statusFilter').value = 'all';
  visibleRecordLimit = 8;
  renderHistory();
});
document.getElementById('showMoreButton').addEventListener('click', () => {
  visibleRecordLimit += 8;
  renderHistory();
});
document.getElementById('downloadButton').addEventListener('click', downloadReport);
document.getElementById('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const loginId = document.getElementById('loginRoll').value.trim();
  const password = document.getElementById('loginPassword').value;
  const error = document.getElementById('loginError');
  const account = students.find(item => item.loginId === loginId && item.password === password);
  if (account) {
    error.hidden = true;
    displayStudent(account);
    sessionStorage.setItem(SESSION_KEY, 'true');
    sessionStorage.setItem('campusly-login-id', account.loginId);
    document.body.classList.add('authenticated');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    error.hidden = false;
  }
});
document.getElementById('logoutButton').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('campusly-login-id');
  document.body.classList.remove('authenticated');
  document.getElementById('loginPassword').value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Show or hide the password field contents
document.getElementById('togglePassword').addEventListener('click', event => {
  const input = document.getElementById('loginPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
});

// Highlight the selected dashboard section in the home navigation
document.querySelectorAll('.home-link').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.home-link').forEach(item => item.classList.remove('active'));
  link.classList.add('active');
}));
