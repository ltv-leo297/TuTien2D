// Run in the browser console on the ORIGINAL GAME'S ORIGIN.
// Downloads only this game's save keys. Import the file from Unity Settings.
(() => {
  const keys = ['truc-khe.profile', 'truc-khe.progress', 'truc-khe.inventory.v1',
    'truc-khe.combat.v1', 'truc-khe.locale', 'truc-khe.motion'];
  const save = {};
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw !== null) save[key] = JSON.parse(raw);
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url; link.download = 'web-save.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
