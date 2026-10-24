// Runs before the game so import, syntax and runtime failures cannot leave
// a silent empty map. This file is embedded in every distributed HTML entry.
(() => {
  const panel = document.getElementById('startup');
  const title = document.getElementById('startup-title');
  const details = document.getElementById('startup-details');
  let state = 'loading';
  let timer;
  function fail(message) {
    if (state === 'error') return;
    const wasRunning = state === 'ready';
    state = 'error';
    clearTimeout(timer);
    document.documentElement.dataset.gameState = 'error';
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    panel.hidden = false;
    panel.classList.add('error');
    title.textContent = wasRunning ? 'La simulation a rencontré une erreur.' : 'Le moteur du jeu n’a pas démarré.';
    details.textContent = String(message || 'Erreur inconnue.').slice(0, 2000);
  }
  window.ZombieBoot = {
    ready() {
      if (state === 'error') return;
      state = 'ready';
      clearTimeout(timer);
      document.documentElement.dataset.gameState = 'ready';
      panel.hidden = true;
    },
    fail
  };
  document.getElementById('startup-reload').onclick = () => location.reload();
  addEventListener('error', event => {
    if (event.target?.tagName === 'SCRIPT' && event.target.src) {
      fail('Impossible de charger le moteur JavaScript. Pour jouer par double-clic, ouvrez index.html ou Jouer.html ; dev.html nécessite un serveur local.');
    } else if (event.message) {
      fail(event.message);
    }
  }, true);
  addEventListener('unhandledrejection', event => fail(event.reason?.message || event.reason));
  timer = setTimeout(() => {
    if (state === 'loading') fail('Le chargement n’a pas abouti. Décompressez le ZIP dans un dossier, puis ouvrez index.html dans Chrome, Edge ou Firefox.');
  }, 8000);
})();
