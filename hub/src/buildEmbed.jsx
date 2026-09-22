// TEST PILOT ONLY. Keep HUB mounted and host the existing BUILD React app
// inside an isolated shadow tree; switching the URL does not reload HUB.
import React from 'react';
import { createRoot } from 'react-dom/client';
import BuildApp from '../../build/src/App.jsx';
import buildCss from '../../build/src/styles.css?inline';
import hubReturnCss from './styles/hub-return.css?inline';

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
    /* Integrated HUB navigation belongs to BUILD's existing centered .shell header.
       No separate full-bleed strip or duplicated BUILD title. */
    .topbar-inner .lac-build-inline-return[data-hub-return] {
      box-sizing: border-box; display: inline-flex; align-items: center;
      justify-content: flex-start; flex: 0 0 auto; gap: 7px;
      min-height: 38px; padding: 8px 9px; border: 1px solid transparent;
      border-radius: 9px; background: transparent; color: #d6b17a;
      font: inherit; font-size: 12px; font-weight: 750;
      line-height: 1.25; white-space: nowrap; cursor: pointer;
    }
    .topbar-inner .lac-build-inline-return[data-hub-return]:hover {
      border-color: rgba(226,180,105,.2);
      background: rgba(226,180,105,.075); color: #f5d49e;
    }
    @media (max-width: 900px) {
      .topbar-inner .lac-build-inline-return[data-hub-return] {
        order: -1; flex: 0 0 100%; min-height: 34px; padding: 5px 0;
        border-radius: 0; border-bottom: 1px solid rgba(226,180,105,.13);
      }
    }
    @media (max-width: 420px) {
      .topbar-inner .lac-build-inline-return[data-hub-return] { font-size: 11px; }
    }
    `;
  shadow.appendChild(style);
  const appRoot = document.createElement('div');
  appRoot.id = 'lac-build-react-root';
  shadow.appendChild(appRoot);
  createRoot(appRoot).render(<BuildApp onHubReturn={() => {
    window.dispatchEvent(new CustomEvent('lac:navigate-hub'));
  }} />);
}
