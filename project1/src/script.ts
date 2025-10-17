/* ===== helpers ===== */
function byId<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}
function $all<T extends Element>(sel: string, root: ParentNode = document) {
  return Array.from(root.querySelectorAll(sel)) as T[];
}
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== footer year ===== */
byId<HTMLSpanElement>("year")?.append(String(new Date().getFullYear()));

/* ===== theming ===== */
type CSSVars = Record<string, string>;
const LIGHT: CSSVars = {
  "--bg": "#ffffff",
  "--ink": "#121416",
  "--muted": "#6b7280",
  "--card": "#f6f7f9",
  "--surface": "rgba(255,255,255,0.92)",
  "--line": "#e5e7eb",
  "--accent": "#176b6b",
};
const DARK: CSSVars = {
  "--bg": "#0b0c10",
  "--ink": "#e5e7eb",
  "--muted": "#93a0b4",
  "--card": "#111318",
  "--surface": "rgba(18,21,26,0.88)",
  "--line": "#2a3240",
  "--accent": "#22a39f",
};
const root = document.documentElement.style;
const THEME = "prefers-dark";
const mql = window.matchMedia("(prefers-color-scheme: dark)");
const themeBtn = byId<HTMLButtonElement>("themeToggle");

function apply(vars: CSSVars) {
  for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
}
function stored(): null | boolean {
  const v = localStorage.getItem(THEME);
  return v === null ? null : v === "true";
}
function isDark(): boolean {
  const s = stored();
  return s === null ? mql.matches : s;
}
function setTheme(dark: boolean) {
  apply(dark ? DARK : LIGHT);
  localStorage.setItem(THEME, String(dark));
  themeBtn?.setAttribute("aria-pressed", dark ? "true" : "false");
}
setTheme(isDark());
mql.addEventListener?.("change", () => {
  if (stored() === null) setTheme(mql.matches);
});
themeBtn?.addEventListener("click", () => setTheme(!isDark()));

/* ===== back-to-top ===== */
const btt = byId<HTMLButtonElement>("backToTop");
const showBtt = () => {
  if (btt) btt.style.display = window.scrollY > 400 ? "block" : "none";
};
showBtt();
window.addEventListener("scroll", showBtt);
btt?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" })
);

/* ===== scroll progress (injected) ===== */
const prog = document.createElement("div");
prog.setAttribute("data-progress", "");
document.body.appendChild(prog);
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
const sections = $all<HTMLElement>("main section[id]");
const navLinks = $all<HTMLAnchorElement>(
  ".menu a[href^='#'], .menu a[href$='.html']"
);
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
function handleSubmit(e: SubmitEvent): boolean {
  e.preventDefault();
  byId<HTMLParagraphElement>("formStatus")!.textContent =
    "Thanks! (Demo — message not actually sent.)";
  (e.target as HTMLFormElement | null)?.reset();
  return false;
}
declare global {
  interface Window {
    handleSubmit?: (e: SubmitEvent) => boolean;
  }
}
window.handleSubmit = handleSubmit;

/* ===== LIGHTBOX ===== */
type LightboxState = { idx: number; nodes: HTMLImageElement[] };
const lightboxImages = $all<HTMLImageElement>("img[data-lightbox]");
let lbState: LightboxState | null = null;

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
const lbImg = lb.querySelector(".lb-img") as HTMLImageElement;
const lbCap = lb.querySelector(".lb-cap") as HTMLDivElement;
const lbClose = lb.querySelector(".lb-x") as HTMLButtonElement;

function openLightbox(nodes: HTMLImageElement[], startIdx: number) {
  lbState = { idx: startIdx, nodes };
  updateLightbox();
  lb.classList.remove("hidden");
}
function closeLightbox() {
  lb.classList.add("hidden");
  lbState = null;
}
function updateLightbox() {
  if (!lbState) return;
  const n = lbState.nodes[lbState.idx];
  lbImg.src = n.src;
  lbImg.alt = n.alt || "";
  lbCap.textContent = n.alt || "";
}
function move(dir: number) {
  if (!lbState) return;
  const total = lbState.nodes.length;
  lbState.idx = (lbState.idx + dir + total) % total;
  updateLightbox();
}

lightboxImages.forEach((img, i) => {
  img.style.cursor = "zoom-in";
  img.addEventListener("click", () => openLightbox(lightboxImages, i));
});

lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox(); // click backdrop
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

export {};
