// Student account management page.
(() => {
  const $ = id => document.getElementById(id);
  let data;

  function renderStudents() {
    const query = $('studentSearch').value.trim().toLowerCase();
    const found = data.students.filter(student => [student.profile.name, student.profile.rollNumber, student.loginId]
      .some(value => String(value).toLowerCase().includes(query)));
    $('studentTableBody').innerHTML = found.map(student => {
      const stats = CampuslyAdminData.summary(student.attendanceRecords);
      const percent = stats.percentage === null ? '—' : `${Math.round(stats.percentage)}%`;
      return `<tr><td><strong>${CampuslyAdminData.escape(student.profile.name)}</strong></td><td>${CampuslyAdminData.escape(student.profile.rollNumber)}</td><td><code>${CampuslyAdminData.escape(student.loginId)}</code></td><td><code>${CampuslyAdminData.escape(student.password)}</code></td><td>${percent}</td><td class="admin-row-actions"><button class="mini-action" type="button" data-action="edit" data-id="${CampuslyAdminData.escape(student.loginId)}">Edit</button><button class="mini-action danger" type="button" data-action="delete" data-id="${CampuslyAdminData.escape(student.loginId)}">Delete</button></td></tr>`;
    }).join('');
    $('emptyStudents').hidden = found.length > 0;
  }

  function resetForm() {
    $('studentForm').reset(); $('editingLoginId').value = '';
    $('studentCourse').value = 'B.Tech · Computer Science'; $('studentYear').value = '3rd year';
    $('studentSemester').value = 'Semester 5'; $('studentDivision').value = 'A';
    $('studentFormTitle').textContent = 'Add a student'; $('saveStudent').innerHTML = 'Create student <span>＋</span>';
    $('cancelEdit').hidden = true;
  }

  function editStudent(loginId) {
    const student = data.students.find(item => item.loginId === loginId);
    if (!student) return;
    $('editingLoginId').value = loginId; $('studentName').value = student.profile.name;
    $('studentRoll').value = student.profile.rollNumber; $('studentLoginId').value = student.loginId;
    $('studentPassword').value = student.password; $('studentCourse').value = student.profile.course;
    $('studentYear').value = student.profile.year; $('studentSemester').value = student.profile.semester;
    $('studentDivision').value = student.profile.division; $('studentFormTitle').textContent = `Edit ${student.profile.name}`;
    $('saveStudent').innerHTML = 'Save student changes <span>✓</span>'; $('cancelEdit').hidden = false;
    $('studentName').focus();
  }

  $('studentForm').addEventListener('submit', event => {
    event.preventDefault();
    const editingId = $('editingLoginId').value;
    const loginId = $('studentLoginId').value.trim();
    const password = $('studentPassword').value;
    const profile = { name: $('studentName').value.trim(), rollNumber: $('studentRoll').value.trim(), course: $('studentCourse').value.trim(), year: $('studentYear').value.trim(), semester: $('studentSemester').value.trim(), division: $('studentDivision').value.trim(), target: 75 };
    if (data.students.some(student => student.loginId.toLowerCase() === loginId.toLowerCase() && student.loginId !== editingId)) {
      window.alert('That login ID is already assigned to another student. Choose a different ID.'); return;
    }
    if (data.students.some(student => student.profile.rollNumber.toLowerCase() === profile.rollNumber.toLowerCase() && student.loginId !== editingId)) {
      window.alert('That roll number is already assigned to another student.'); return;
    }
    if (editingId) {
      const student = data.students.find(item => item.loginId === editingId);
      if (student) { student.loginId = loginId; student.password = password; student.profile = profile; }
    } else {
      data.students.push({ loginId, password, profile, attendanceRecords: [] });
    }
    CampuslyAdminData.save(data); renderStudents(); resetForm();
  });

  $('studentTableBody').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'edit') editStudent(id);
    if (action === 'delete') {
      const student = data.students.find(item => item.loginId === id);
      if (!student || !confirm(`Delete ${student.profile.name} and all attendance records?`)) return;
      data.students = data.students.filter(item => item.loginId !== id);
      if ($('editingLoginId').value === id) resetForm();
      CampuslyAdminData.save(data); renderStudents();
    }
  });
  $('studentSearch').addEventListener('input', renderStudents);
  $('cancelEdit').addEventListener('click', resetForm);
  CampuslyAdminData.load().then(loaded => { data = loaded; renderStudents(); }).catch(error => { $('studentTableBody').innerHTML = `<tr><td colspan="6">${CampuslyAdminData.escape(error.message)}</td></tr>`; });
})();

