// New York Focus brand behavior that the shared classes in brand.css need (from the 2026 election results, 2026-11-04).
// Load it on pages that use them: <script src="brand.js" defer></script> (relative, as every link).
// - Tooltips (.nyf-tip): when one is about to show (hover or focus, which a tap gives it), it's moved so it stays 8px
//   inside the screen, still over what was pointed at where there's room. Without this script they're simply centered,
//   and one near a phone's edge runs off the screen.
(() => {
  const place = (el) => {
    const t = getComputedStyle(el, "::after");
    const w = parseFloat(t.width) + parseFloat(t.paddingLeft) + parseFloat(t.paddingRight);
    if (!w) return;
    const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - 8 - w));
    el.style.setProperty("--tip-x", `${Math.round(left - r.left)}px`);
    el.style.setProperty("--tip-t", "none");
  };
  for (const type of ["pointerover", "focusin"]) document.addEventListener(type, (e) => {
    const el = e.target.closest && e.target.closest(".nyf-tip");
    if (el) place(el);
  });
})();
