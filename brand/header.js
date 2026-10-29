// What the site's JS bundle does for its header, which interactives don't load (npm run build puts this in each page):
// the menu button, the search box that opens on click, and the smaller header once the reader scrolls 50px.
(() => {
  const root = document.currentScript.closest(".nyf-header"), header = root.querySelector("header");
  let open = false;
  const swap = (el, off, on) => {
    (el.dataset[off] || "").split(" ").filter(Boolean).forEach((c) => el.classList.remove(c));
    (el.dataset[on] || "").split(" ").filter(Boolean).forEach((c) => el.classList.add(c));
  };
  const show = () => {
    root.querySelectorAll("[data-nyf-open], [data-nyf-closed]").forEach((el) => swap(el, open ? "nyfClosed" : "nyfOpen", open ? "nyfOpen" : "nyfClosed"));
    root.querySelectorAll("[data-nyf-toggle]").forEach((b) => b.setAttribute("aria-expanded", open));
  };
  show();
  root.querySelectorAll("[data-nyf-toggle]").forEach((button) => button.addEventListener("click", () => {
    open = !open;
    show();
  }));
  root.querySelectorAll(".expandsearch").forEach((link) => link.addEventListener("click", (e) => {
    e.preventDefault();
    root.querySelectorAll(".query").forEach((q) => { q.style.display = ""; if (getComputedStyle(q).display === "none") q.style.display = "block"; });
    root.querySelector(".query")?.focus();
    link.style.display = "none";
  }));
  const shrink = () => header.classList.toggle("smaller", window.scrollY >= 50);
  window.addEventListener("scroll", shrink, { passive: true });
  shrink();
})();
