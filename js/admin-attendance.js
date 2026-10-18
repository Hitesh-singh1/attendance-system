// Attendance record management page.
const attendancePage = (() => {
  const $ = id => document.getElementById(id);
  let data;

  function render() {
    const student = data.students.find(item => item.loginId === $('recordStudent').value);
    const records = student?.attendanceRecords || [];
    $('recordsHeading').textContent = student ? `Attendance records · ${student.profile.name}` : 'Attendance records';
    $('selectedRecordCount').textContent = records.length;
    $('recordTableBody').innerHTML = records.map((record, index) => {
      const subject = data.subjects.find(item => item.id === record.subjectId);
      const label = record.status === 'present' ? 'Present' : 'Absent';
      return `<tr><td>${CampuslyAdminData.escape(record.date)}</td><td>${CampuslyAdminData.escape(subject?.name || 'Unknown subject')}</td><td><span class="history-status ${record.status}">${label}</span></td><td class="admin-row-actions"><button class="mini-action" data-action="edit" data-index="${index}" type="button">Edit</button><button class="mini-action danger" data-action="delete" data-index="${index}" type="button">Delete</button></td></tr>`;
    }).join('');
    $('emptyRecords').hidden = records.length > 0;
    $('recordsTable').hidden = records.length === 0;
  }

  function resetForm() {
    $('editingRecordIndex').value = ''; $('recordDate').value = ''; $('recordStatus').value = 'present';
    $('attendanceFormTitle').textContent = 'Add attendance'; $('saveRecord').innerHTML = 'Save attendance <span>✓</span>';
    $('cancelRecordEdit').hidden = true;
  }

  function populateOptions() {
    const previousStudent = $('recordStudent').value;
    $('recordStudent').innerHTML = data.students.map(student => `<option value="${CampuslyAdminData.escape(student.loginId)}">${CampuslyAdminData.escape(student.profile.name)} · ${CampuslyAdminData.escape(student.profile.rollNumber)}</option>`).join('') || '<option value="">No students yet</option>';
    if (data.students.some(student => student.loginId === previousStudent)) $('recordStudent').value = previousStudent;
    $('recordSubject').innerHTML = data.subjects.map(subject => `<option value="${CampuslyAdminData.escape(subject.id)}">${CampuslyAdminData.escape(subject.name)} (${CampuslyAdminData.escape(subject.code)})</option>`).join('') || '<option value="">No subjects available</option>';
    $('recordStudent').disabled = data.students.length === 0;
    $('recordSubject').disabled = data.subjects.length === 0;
    $('saveRecord').disabled = data.students.length === 0 || data.subjects.length === 0;
    render();
  }

  $('attendanceForm').addEventListener('submit', event => {
    event.preventDefault();
    const student = data.students.find(item => item.loginId === $('recordStudent').value);
    if (!student || !$('recordSubject').value) return;
    const record = { date: $('recordDate').value, subjectId: $('recordSubject').value, status: $('recordStatus').value };
    const index = $('editingRecordIndex').value;
    if (index === '') student.attendanceRecords.push(record);
    else student.attendanceRecords[Number(index)] = record;
    CampuslyAdminData.save(data); resetForm(); render();
  });

  $('recordStudent').addEventListener('change', () => { resetForm(); render(); });
  $('cancelRecordEdit').addEventListener('click', resetForm);
  $('recordTableBody').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const student = data.students.find(item => item.loginId === $('recordStudent').value);
    const index = Number(button.dataset.index);
    if (!student || !student.attendanceRecords[index]) return;
    if (button.dataset.action === 'edit') {
      const record = student.attendanceRecords[index];
      $('editingRecordIndex').value = index; $('recordSubject').value = record.subjectId;
      $('recordDate').value = record.date; $('recordStatus').value = record.status;
      $('attendanceFormTitle').textContent = 'Edit attendance'; $('saveRecord').innerHTML = 'Save changes <span>✓</span>';
      $('cancelRecordEdit').hidden = false; $('attendanceForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (button.dataset.action === 'delete' && confirm('Delete this attendance record?')) {
      student.attendanceRecords.splice(index, 1); CampuslyAdminData.save(data); resetForm(); render();
    }
  });
  CampuslyAdminData.load().then(loaded => { data = loaded; populateOptions(); }).catch(error => { $('emptyRecords').textContent = error.message; $('emptyRecords').hidden = false; });
})();
