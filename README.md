# AXE ONE WEB STAGING 3.26.16 — FUND ledger axis specificity fix R1

Baseline: recovered 3.26.14 STAGING source.

## Scope
- WEB only.
- FUND ledger only.
- Preserve the accepted 636px FUND rail and the existing 8-column markup.
- No DB, BOT, API, onboarding, or other page behavior changes.
- No `index.html` asset/build-path changes.

## Root cause fixed
3.26.13 intentionally aligned header cells differently using selectors such as
`.axe-fund-ledger-columns>span:nth-child(2)`. The 3.26.14 centering rule used the
less-specific generic selector `.axe-fund-ledger-columns>span`, so CSS
specificity kept the old header alignment even though body cells were centered.
That is why DATE looked correct while NAME / ACCOUNT / ENTRY / TYPE / AMOUNT
appeared shifted relative to their row values.

3.26.16 changes only the final header selector to
`.axe-fund-ledger-columns>span:nth-child(n)`, giving it equal specificity and
later source order. Header and row values therefore use the same center axis in
every one of the eight grid tracks.

## Safety
A regression check also verifies that `index.html` still points to `/src/main.js`,
`main.js` still imports `styles.css`, and `styles.css` still imports `fund.css`.
This specifically avoids repeating the 3.26.15 asset-path failure.
