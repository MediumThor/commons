// Loaded synchronously before first paint so the saved theme never flashes. CSP forbids inline scripts.
(function () {
  var saved = null;
  try { saved = localStorage.getItem('oc-theme'); } catch (e) {}
  var dark = saved ? saved === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
