// A broad pale card counts as paper; the saturated app field does not.
export function isPaperColor(red: number, green: number, blue: number) {
  return (
    Math.min(red, green, blue) >= 205 &&
    Math.max(red, green, blue) - Math.min(red, green, blue) <= 45
  );
}

export function nextDockOverlap(ratio: number, previous: boolean) {
  // Hysteresis prevents tiny card edges / scroll bounce from flickering.
  return ratio >= (previous ? 0.1 : 0.2);
}

export function observeDockSurface(nav: HTMLElement) {
  const context = document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) return () => {};
  context.canvas.width = context.canvas.height = 1;
  let frame = 0;
  let overlapping = false;

  function sample() {
    frame = 0;
    if (!context || !nav.isConnected) return;
    const bounds = nav.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const colors = new Map<Element, boolean>();
    function isPaper(element: Element | null): boolean {
      if (!element || !context) return false;
      if (element.matches("html, body, .app-backdrop")) return false;
      const cached = colors.get(element);
      if (cached !== undefined) return cached;
      const background = getComputedStyle(element).backgroundColor;
      // Resolve CSS color spaces locally; never draw/read any user image.
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
      const paper =
        alpha >= 180 ? isPaperColor(r, g, b) : isPaper(element.parentElement);
      colors.set(element, paper);
      return paper;
    }
    let total = 0;
    let paper = 0;
    for (const yRatio of [0.2, 0.5, 0.8]) {
      for (const xRatio of [0.12, 0.31, 0.5, 0.69, 0.88]) {
        const x = bounds.left + bounds.width * xRatio;
        const y = bounds.top + bounds.height * yRatio;
        if (y < 0 || y >= window.innerHeight) continue;
        const behind = document
          .elementsFromPoint(x, y)
          .find((element) => !nav.contains(element));
        total++;
        if (isPaper(behind ?? null)) paper++;
      }
    }
    overlapping = nextDockOverlap(total ? paper / total : 0, overlapping);
    nav.dataset.overPaper = String(overlapping);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(sample);
  }
  const resize = new ResizeObserver(schedule);
  resize.observe(nav);
  resize.observe(document.body);
  const content = new MutationObserver(schedule);
  content.observe(document.querySelector("main") ?? document.body, {
    childList: true,
    subtree: true,
  });
  const theme = new MutationObserver(schedule);
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-skin"],
  });
  document.addEventListener("scroll", schedule, {
    passive: true,
    capture: true,
  });
  document.addEventListener("toggle", schedule, true);
  document.addEventListener("load", schedule, true);
  document.addEventListener("transitionend", schedule, true);
  document.addEventListener("animationend", schedule, true);
  window.addEventListener("resize", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    content.disconnect();
    theme.disconnect();
    document.removeEventListener("scroll", schedule, true);
    document.removeEventListener("toggle", schedule, true);
    document.removeEventListener("load", schedule, true);
    document.removeEventListener("transitionend", schedule, true);
    document.removeEventListener("animationend", schedule, true);
    window.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("scroll", schedule);
  };
}
