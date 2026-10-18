// Populate the student profile page from the same JSON as the dashboard.
const DATA_FILE = 'data/students.json';
const LOGIN_ID_KEY = 'campusly-login-id';

async function loadCurrentAccount() {
  const loginId = sessionStorage.getItem(LOGIN_ID_KEY);
  if (!loginId) {
    window.location.href = 'index.html';
    return null;
  }

  const response = await fetch(DATA_FILE);
  if (!response.ok) throw new Error('Student data could not be loaded.');

  const baseData = await response.json();
  const storedData = localStorage.getItem('campusly-student-data');
  const data = storedData ? JSON.parse(storedData) : baseData;
  const account = data.students.find(student => student.loginId === loginId);
  if (!account) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return null;
  }

  return { account };
}

function attendanceSummary(records) {
  const attended = records.filter(record => record.status === 'present').length;
  const conducted = records.length;
  return {
    conducted,
    attended,
    missed: conducted - attended,
    percentage: conducted ? (attended / conducted) * 100 : null
  };
}

function renderProfile(account) {
  const profile = account.profile;
  const summary = attendanceSummary(account.attendanceRecords);
  const roundedPercent = summary.percentage === null ? '—' : `${Math.round(summary.percentage)}%`;
  const initials = profile.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  document.getElementById('profileInitials').textContent = initials;
  document.getElementById('profileName').textContent = profile.name;
  document.getElementById('profileSummary').textContent = `${profile.course} · Roll no. ${profile.rollNumber}`;
  document.getElementById('profileFullName').textContent = profile.name;
  document.getElementById('profileRollNumber').textContent = profile.rollNumber;
  document.getElementById('profileCourse').textContent = profile.course;
  document.getElementById('profileYear').textContent = profile.year;
  document.getElementById('profileSemester').textContent = `${profile.semester} · Fall 2025–26`;
  document.getElementById('profileDivision').textContent = profile.division;
  document.getElementById('profileTarget').textContent = `${profile.target}% minimum`;
  document.getElementById('profilePercent').textContent = roundedPercent;
  document.getElementById('profileProgress').style.width = `${Math.min(summary.percentage || 0, 100)}%`;
  document.getElementById('profileConducted').textContent = summary.conducted;
  document.getElementById('profileAttended').textContent = summary.attended;
  document.getElementById('profileMissed').textContent = summary.missed;
}

loadCurrentAccount()
  .then(result => {
    if (!result) return;
    const { account } = result;
    if (document.getElementById('profileName')) renderProfile(account);
  })
  .catch(() => {
    const pageContent = document.querySelector('.details-wrap');
    pageContent.insertAdjacentHTML('beforeend', '<p class="page-note">Could not load student data. Open the project using VS Code Live Server.</p>');
  });



