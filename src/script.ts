/* ===== helpers ===== */
// Shorthand for document.getElementById with a typed return.
function byId<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}

// Query all matching elements, returned as a typed array.
function $all<T extends Element>(sel: string, root: ParentNode = document) {
  return Array.from(root.querySelectorAll(sel)) as T[];
}

// Detects the user's reduced-motion preference once (used to disable animations).
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== footer year ===== */
// Append the current year into the <span id="year">…</span> in the footer.
byId<HTMLSpanElement>("year")?.append(String(new Date().getFullYear()));

/* ===== theming ===== */
// Type alias for a simple map of CSS custom properties to string values.
type CSSVars = Record<string, string>;

// Light theme variables (these match what the CSS expects).
const LIGHT: CSSVars = {
  "--bg": "#ffffff",
  "--ink": "#121416",
  "--muted": "#6b7280",
  "--card": "#f6f7f9",
  "--surface": "rgba(255,255,255,0.92)",
  "--line": "#e5e7eb",
  "--accent": "#176b6b",
};

// Dark theme variables (contrast-tuned for readability).
const DARK: CSSVars = {
  "--bg": "#0b0c10",
  "--ink": "#e5e7eb",
  "--muted": "#93a0b4",
  "--card": "#111318",
  "--surface": "rgba(18,21,26,0.88)",
  "--line": "#2a3240",
  "--accent": "#22a39f",
};

// Style object for setting CSS variables on :root
const root = document.documentElement.style;

// localStorage key to remember the theme choice.
const THEME = "prefers-dark";

// Media query for OS dark mode preference.
const mql = window.matchMedia("(prefers-color-scheme: dark)");

// Theme toggle button in the header (may be null if not present on a page).
const themeBtn = byId<HTMLButtonElement>("themeToggle");

// Apply all CSS custom properties from a theme map.
function apply(vars: CSSVars) {
  for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
}

// Read stored theme choice. Returns null if the user hasn’t set one yet.
function stored(): null | boolean {
  const v = localStorage.getItem(THEME);
  return v === null ? null : v === "true";
}

// Decide whether dark mode should be on:
// - If there’s a stored choice, use it.
// - Otherwise, fall back to OS preference (mql.matches).
function isDark(): boolean {
  const s = stored();
  return s === null ? mql.matches : s;
}

// Set the theme variables, persist the choice, and update aria-pressed on the button.
function setTheme(dark: boolean) {
  apply(dark ? DARK : LIGHT);
  localStorage.setItem(THEME, String(dark));
  themeBtn?.setAttribute("aria-pressed", dark ? "true" : "false");
}

// Initialize theme on load using stored/OS preference.
setTheme(isDark());

// If the OS theme changes and the user hasn't chosen explicitly, follow the OS.
mql.addEventListener?.("change", () => {
  if (stored() === null) setTheme(mql.matches);
});

// Toggle theme on button click (if the button exists).
themeBtn?.addEventListener("click", () => setTheme(!isDark()));

/* ===== back-to-top ===== */
// Button that appears after scrolling down a bit.
const btt = byId<HTMLButtonElement>("backToTop");

// Show/hide the back-to-top button based on scroll position.
const showBtt = () => {
  if (btt) btt.style.display = window.scrollY > 400 ? "block" : "none";
};
showBtt();
window.addEventListener("scroll", showBtt);

// Smoothly scroll to the top (respect reduced-motion preference).
btt?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" })
);

/* ===== scroll progress (injected) ===== */
// A thin bar at the top that shows how far down the page you’ve scrolled.
const prog = document.createElement("div");
prog.setAttribute("data-progress", "");
document.body.appendChild(prog);

// Update the --pct CSS variable as the user scrolls.
const onProg = () => {
  const max = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight
  );
  prog.style.setProperty("--pct", `${(window.scrollY / max) * 100}%`);
};
onProg();
window.addEventListener("scroll", onProg);

/* ===== section-aware nav highlight ===== */
// As sections enter the viewport, add .active to the matching nav link.
const sections = $all<HTMLElement>("main section[id]");
const navLinks = $all<HTMLAnchorElement>(
  ".menu a[href^='#'], .menu a[href$='.html']"
);

// Observe sections with some margins so the highlight feels natural.
const io = new IntersectionObserver(
  (ents) => {
    for (const e of ents) {
      if (e.isIntersecting && e.target instanceof HTMLElement) {
        const id = e.target.id;
        navLinks.forEach((a) =>
          a.classList.toggle(
            "active",
            (a.getAttribute("href") || "").endsWith(`#${id}`)
          )
        );
      }
    }
  },
  { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
);
sections.forEach((s) => io.observe(s));

/* ===== reveal-on-scroll ===== */
// Add a subtle slide/fade-in for cards and images, unless the user prefers reduced motion.
if (!prefersReduced()) {
  const reveal = $all<HTMLElement>(".card, .grid-3 img, .about-figure img");
  reveal.forEach((el) => el.classList.add("will-reveal"));
  const ro = new IntersectionObserver(
    (es, obs) => {
      es.forEach((en) => {
        if (en.isIntersecting) {
          (en.target as HTMLElement).classList.add("revealed");
          obs.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );
  reveal.forEach((el) => ro.observe(el));
}

/* ===== smooth anchors ===== */
// Intercept clicks on hash links to smoothly scroll to the target element.
// (Respects reduced motion; also updates the URL hash with history.pushState.)
$all<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (ev) => {
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href) as HTMLElement | null;
    if (!target) return;
    ev.preventDefault();
    target.scrollIntoView({
      behavior: prefersReduced() ? "auto" : "smooth",
      block: "start",
    });
    history.pushState(null, "", href);
  });
});

/* ===== contact form (demo) ===== */
// Prevents page reload, shows a friendly status message, and clears the form.
function handleSubmit(e: SubmitEvent): boolean {
  e.preventDefault();
  byId<HTMLParagraphElement>("formStatus")!.textContent =
    "Thanks! (Demo — message not actually sent.)";
  (e.target as HTMLFormElement | null)?.reset();
  return false;
}

// Expose the handler to the global window so the inline onsubmit in HTML can call it.
// (This is the pattern you're already using; not adding/changing behavior.)
declare global {
  interface Window {
    handleSubmit?: (e: SubmitEvent) => boolean;
  }
}
window.handleSubmit = handleSubmit;

/* ===== LIGHTBOX ===== */
// Minimal image lightbox: clicking any <img data-lightbox> opens an overlay and lets you navigate.

type LightboxState = { idx: number; nodes: HTMLImageElement[] };
const lightboxImages = $all<HTMLImageElement>("img[data-lightbox]");
let lbState: LightboxState | null = null;

// Create the overlay DOM once (hidden by default via .hidden).
const lb = document.createElement("div");
lb.className = "lb hidden";
lb.innerHTML = `
  <button class="lb-x" aria-label="Close">✕</button>
  <div class="lb-nav">
    <button class="lb-btn" data-dir="-1" aria-label="Previous">‹</button>
    <button class="lb-btn" data-dir="1" aria-label="Next">›</button>
  </div>
  <div class="lb-inner" role="dialog" aria-modal="true">
    <img class="lb-img" alt="" />
    <div class="lb-cap"></div>
  </div>
`;
document.body.appendChild(lb);

// Quick references to inner elements we update a lot.
const lbImg = lb.querySelector(".lb-img") as HTMLImageElement;
const lbCap = lb.querySelector(".lb-cap") as HTMLDivElement;
const lbClose = lb.querySelector(".lb-x") as HTMLButtonElement;

// Open overlay at a specific image index.
function openLightbox(nodes: HTMLImageElement[], startIdx: number) {
  lbState = { idx: startIdx, nodes };
  updateLightbox();
  lb.classList.remove("hidden");
}

// Close overlay and clear state.
function closeLightbox() {
  lb.classList.add("hidden");
  lbState = null;
}

// Load the current image and caption into the overlay.
function updateLightbox() {
  if (!lbState) return;
  const n = lbState.nodes[lbState.idx];
  lbImg.src = n.src;
  lbImg.alt = n.alt || "";
  lbCap.textContent = n.alt || "";
}

// Move to the next/previous image, wrapping around.
function move(dir: number) {
  if (!lbState) return;
  const total = lbState.nodes.length;
  lbState.idx = (lbState.idx + dir + total) % total;
  updateLightbox();
}

// Make each lightbox-enabled image clickable (sets cursor and click handler).
lightboxImages.forEach((img, i) => {
  img.style.cursor = "zoom-in";
  img.addEventListener("click", () => openLightbox(lightboxImages, i));
});

// Close when clicking the dark backdrop, use buttons for nav, support Esc/Arrow keys.
lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox(); // click backdrop to close
});
lbClose.addEventListener("click", closeLightbox);
lb.querySelectorAll<HTMLButtonElement>(".lb-btn").forEach((btn) => {
  btn.addEventListener("click", () => move(Number(btn.dataset.dir)));
});
window.addEventListener("keydown", (e) => {
  if (!lbState) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowLeft") move(-1);
});

// Export nothing; this keeps the file as a module (useful for some TS configs).
export {};
