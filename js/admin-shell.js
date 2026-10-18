// Shared navigation protection for admin subpages.
(() => {
  if (sessionStorage.getItem('campusly-admin-authenticated') !== 'true') {
    window.location.replace('admin.html');
    return;
  }
  document.getElementById('adminContent').hidden = false;
  document.getElementById('adminLogout').addEventListener('click', () => {
    sessionStorage.removeItem('campusly-admin-authenticated');
    window.location.href = 'admin.html';
  });
})();
