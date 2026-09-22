// TEST PILOT ONLY. Keep HUB mounted and host the existing BUILD React app
// inside an isolated shadow tree; switching the URL does not reload HUB.
import React from 'react';
import { createRoot } from 'react-dom/client';
import BuildApp from '../../build/src/App.jsx';
import buildCss from '../../build/src/styles.css?inline';
import hubReturnCss from './styles/hub-return.css?inline';
import { HUB_RETURN_INNER } from './ui/hubReturnButton.js';

let mounted = false;

export function mountEmbeddedBuild(host) {
  if (mounted) return;
  mounted = true;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  // BUILD's :root variables belong to its isolated host, not the HUB document.
  style.textContent = buildCss.replace(/:root\b/g, ':host') + hubReturnCss + `
    :host { display: block; min-height: 100vh; color: #f4f4f5;
      font-family: Inter, Pretendard, "Noto Sans KR", system-ui, sans-serif;
      background: #09090a; }
    .app { min-height: 100vh; background: var(--bg, #09090a); }
    .lac-build-topbar { display: flex; justify-content: flex-end; align-items: center;
      box-sizing: border-box; min-height: 56px; padding: 9px clamp(16px, 3vw, 32px);
      border-bottom: 1px solid rgba(227,181,105,.25); background: #0c1218; }
    `;
  shadow.appendChild(style);
  const topbar = document.createElement('header');
  topbar.className = 'lac-build-topbar';
  const returnButton = document.createElement('button');
  returnButton.type = 'button';
  returnButton.setAttribute('data-hub-return', '');
  returnButton.setAttribute('aria-label', 'LAC HUB 메인으로 이동');
  returnButton.innerHTML = HUB_RETURN_INNER;
  returnButton.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('lac:navigate-hub'));
  });
  topbar.appendChild(returnButton);
  shadow.appendChild(topbar);
  const appRoot = document.createElement('div');
  appRoot.id = 'lac-build-react-root';
  shadow.appendChild(appRoot);
  createRoot(appRoot).render(<BuildApp />);
}
