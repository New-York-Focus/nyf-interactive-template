// The header's menu button, which runs on the site's JS bundle (Alpine.js); interactives don't load it, so this does the
// same (npm run build puts it in each page). The sync turns the site's :class attributes into data-nyf-open and
// data-nyf-closed: the classes an element has when the menu is open or closed.
(() => {
  const root = document.currentScript.closest(".nyf-header");
  let open = false;
  const show = () => {
    root.querySelectorAll("[data-nyf-open], [data-nyf-closed]").forEach((el) => {
      const [off, on] = open ? [el.dataset.nyfClosed, el.dataset.nyfOpen] : [el.dataset.nyfOpen, el.dataset.nyfClosed];
      (off || "").split(" ").filter(Boolean).forEach((c) => el.classList.remove(c));
      (on || "").split(" ").filter(Boolean).forEach((c) => el.classList.add(c));
    });
    root.querySelectorAll("[data-nyf-toggle]").forEach((b) => b.setAttribute("aria-expanded", open));
  };
  show();
  root.querySelectorAll("[data-nyf-toggle]").forEach((b) => b.addEventListener("click", () => { open = !open; show(); }));
})();
