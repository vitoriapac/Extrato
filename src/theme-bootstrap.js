(function () {
  try {
    var saved = localStorage.getItem('bb-premium-theme');
    var theme =
      saved === 'dark' || saved === 'light'
        ? saved
        : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    // Density is a per-browser UI preference, applied before first paint like the theme.
    if (localStorage.getItem('studytrack.density') === 'compact')
      document.documentElement.setAttribute('data-density', 'compact');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
