import assert from 'node:assert/strict';
import { initializePrimaryScreenHistory, recordPrimaryScreen, readPrimaryScreen } from '../src/platform/screenHistory.js';

function mockBrowserHistory() {
  const entries = [{ legacyOAuth: true }];
  let position = 0;
  return {
    get state() { return entries[position]; },
    get length() { return entries.length; },
    replaceState(next) { entries[position] = next; },
    pushState(next) { entries.splice(++position); entries.push(next); },
    back() { if (position > 0) position--; return entries[position]; },
    forward() { if (position < entries.length - 1) position++; return entries[position]; },
  };
}

const history = mockBrowserHistory();
assert.equal(initializePrimaryScreenHistory(history), 'hub');
assert.equal(readPrimaryScreen(history.state), 'hub');
assert.equal(history.state.legacyOAuth, true); // Do not overwrite other same-origin history state.
recordPrimaryScreen(history, 'dashboard');
assert.equal(history.length, 2);
assert.equal(readPrimaryScreen(history.state), 'dashboard');
assert.equal(readPrimaryScreen(history.back()), 'hub'); // Back stays inside HUB.
assert.equal(readPrimaryScreen(history.forward()), 'dashboard');
recordPrimaryScreen(history, 'hub');
assert.equal(readPrimaryScreen(history.back()), 'dashboard');
recordPrimaryScreen(history, 'company-start'); // Branching removes the old forward entry.
assert.equal(readPrimaryScreen(history.back()), 'dashboard');
assert.equal(readPrimaryScreen(history.forward()), 'company-start');
assert.equal(initializePrimaryScreenHistory(history), 'company-start'); // Same-entry reload.
assert.equal(readPrimaryScreen(null), null);
assert.throws(() => recordPrimaryScreen(history, 'logout'), /Invalid HUB screen/);
console.log('HUB history: PASS (browser Back/Forward, company entry, reload, state preservation).');
