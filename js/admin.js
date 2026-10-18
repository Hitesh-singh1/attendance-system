// Demo credentials; real deployments need server-side authentication.
const ADMIN_ID = 'Riya';
const ADMIN_PASSWORD = 'Riya@123';
const byId = id => document.getElementById(id);

function setAuthenticated(isAuthenticated) {
  byId('adminLoginView').hidden = isAuthenticated;
  byId('adminConsole').hidden = !isAuthenticated;
  byId('adminNav').hidden = !isAuthenticated;
  byId('adminLogout').hidden = !isAuthenticated;
}

async function renderOverview() {
  const data = await CampuslyAdminData.load();
  byId('studentTotal').textContent = data.students.length;
  byId('subjectTotal').textContent = data.subjects.length;
  byId('recordTotal').textContent = data.students.reduce((count, student) => count + (student.attendanceRecords || []).length, 0);
}

byId('adminLoginForm').addEventListener('submit', async event => {
  event.preventDefault();
  byId('adminLoginError').hidden = true;
  byId('adminDataError').hidden = true;
  if (byId('adminLoginId').value.trim() !== ADMIN_ID || byId('adminLoginPassword').value !== ADMIN_PASSWORD) {
    byId('adminLoginError').hidden = false;
    return;
  }
  try {
    await CampuslyAdminData.load();
    sessionStorage.setItem('campusly-admin-authenticated', 'true');
    setAuthenticated(true);
    await renderOverview();
  } catch (error) {
    byId('adminDataError').textContent = error.message;
    byId('adminDataError').hidden = false;
  }
});

byId('adminLogout').addEventListener('click', () => {
  sessionStorage.removeItem('campusly-admin-authenticated');
  window.location.href = 'admin.html';
});
byId('exportJson').addEventListener('click', async () => CampuslyAdminData.exportJson(await CampuslyAdminData.load()));
byId('resetData').addEventListener('click', () => {
  const confirmed = window.confirm('Reset all browser-saved changes and restore the original students.json data? This cannot be undone.');
  if (!confirmed) return;
  localStorage.removeItem('campusly-student-data');
  window.location.reload();
});

if (sessionStorage.getItem('campusly-admin-authenticated') === 'true') {
  setAuthenticated(true);
  renderOverview().catch(error => {
    byId('adminConsole').insertAdjacentHTML('beforeend', `<p class="admin-error">${CampuslyAdminData.escape(error.message)}</p>`);
  });
} else setAuthenticated(false);

