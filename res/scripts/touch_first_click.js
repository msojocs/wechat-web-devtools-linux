/* [touch-first-click] fix for the dropped first touchend in the simulator
 *
 * Symptom
 *   After compiling a mini program, the first click on a button inside the
 *   simulator does nothing; a second click works. Real devices are fine.
 *
 * Cause
 *   The DevTools runs on Electron/Chromium. Its mouse-to-touch emulation layer
 *   drops the touchend of the first click in a session: the render layer only
 *   receives the touchstart. A weapp `tap` has to be produced from a paired
 *   touchstart + touchend, so without the touchend no tap is generated and
 *   bindtap handlers are never called.
 *
 * Fix
 *   Register capture-phase listeners on the render layer document and re-send
 *   the missing touchend. The repair only happens when a real mouseup/pointerup
 *   has arrived and the touchend is still missing after a short confirmation
 *   window, so it is equivalent to a normal finger release:
 *     - no long press needed, no second click needed;
 *     - healthy clicks are left untouched (no double trigger).
 *
 * This file is prepended to js/extensions/inject/documentstart/index.js, which
 * the DevTools injects into the render layer at document start (it is the file
 * served as /__dev__/documentstart.js and referenced by html/pageframe.html).
 */
(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__wxTouchFixInstalled) return;
  window.__wxTouchFixInstalled = true;

  const CONFIRM_MS = 30;
  let target = null;
  let touch = null;
  let ended = true;
  let timer = null;
  let repaired = 0;

  const log = (...args) => {
    try { console.log('[touch-first-click]', ...args); } catch (e) {}
  };

  const onTouchStart = (e) => {
    const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    if (!t) return;
    target = e.target;
    touch = t;
    ended = false;
  };

  const onTouchEnd = () => {
    ended = true;
    target = null;
    touch = null;
  };

  const onTouchCancel = () => {
    ended = true;
    target = null;
    touch = null;
  };

  // Give a real touchend the chance to be dispatched together with the mouse
  // event, then repair only if it never came.
  const scheduleRepair = (kind, e) => {
    if (ended || !target || !touch || timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (ended || !target || !touch) return;
      const t = touch;
      const el = target;
      ended = true;
      target = null;
      touch = null;
      repaired += 1;
      try {
        el.dispatchEvent(new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          changedTouches: [t],
          touches: [],
          targetTouches: [],
        }));
        log('sent missing touchend after ' + kind + ' (total ' + repaired + ')');
      } catch (err) {
        log('failed to send touchend: ' + err);
      }
    }, CONFIRM_MS);
  };

  document.addEventListener('touchstart', onTouchStart, true);
  document.addEventListener('touchend', onTouchEnd, true);
  document.addEventListener('touchcancel', onTouchCancel, true);
  document.addEventListener('pointerup', (e) => scheduleRepair('pointerup', e), true);
  document.addEventListener('mouseup', (e) => scheduleRepair('mouseup', e), true);

  window.__wxTouchFixLog = () => repaired;
})();
