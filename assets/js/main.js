const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const abstractPanels = [];

const setPanelAccessibility = (panel, expanded) => {
    panel.setAttribute("aria-hidden", String(!expanded));
    panel.toggleAttribute("inert", !expanded);
};

const settlePanel = (entry, expanded) => {
    if (entry.animation) {
        entry.animation.onfinish = null;
        entry.animation.cancel();
        entry.animation = null;
    }

    entry.panel.style.removeProperty("overflow");
    entry.panel.hidden = !expanded;
    setPanelAccessibility(entry.panel, expanded);
};

// Without JavaScript, the full abstract stays readable and no inert button is shown.
document.querySelectorAll(".abstract-button").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));

    if (!panel) return;

    const entry = { button, panel, animation: null };
    abstractPanels.push(entry);
    settlePanel(entry, false);
    button.setAttribute("aria-expanded", "false");
    button.hidden = false;

    button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") !== "true";
        const startHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
        const startMargin = panel.hidden ? 0 : parseFloat(getComputedStyle(panel).marginTop);

        // Capture the current animated frame before cancelling, so rapid clicks
        // reverse direction from the present position rather than jumping.
        if (entry.animation) {
            entry.animation.onfinish = null;
            entry.animation.cancel();
            entry.animation = null;
        }

        button.setAttribute("aria-expanded", String(expanded));
        panel.hidden = false;
        setPanelAccessibility(panel, expanded);

        if (reducedMotion.matches || typeof panel.animate !== "function") {
            settlePanel(entry, expanded);
            return;
        }

        const endHeight = expanded ? panel.getBoundingClientRect().height : 0;
        const endMargin = expanded ? parseFloat(getComputedStyle(panel).marginTop) : 0;
        panel.style.overflow = "hidden";

        try {
            const animation = panel.animate([
                { height: startHeight + "px", marginTop: startMargin + "px" },
                { height: endHeight + "px", marginTop: endMargin + "px" },
            ], {
                duration: 220,
                easing: "cubic-bezier(0.2, 0, 0.38, 0.9)",
            });

            entry.animation = animation;
            animation.onfinish = () => {
                if (entry.animation === animation) settlePanel(entry, expanded);
            };
        } catch {
            settlePanel(entry, expanded);
        }
    });
});

const finishPanelTransitions = () => {
    abstractPanels.forEach((entry) => {
        settlePanel(entry, entry.button.getAttribute("aria-expanded") === "true");
    });
};

if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", finishPanelTransitions);
} else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(finishPanelTransitions);
}

window.addEventListener("resize", finishPanelTransitions, { passive: true });
window.addEventListener("beforeprint", () => {
    abstractPanels.forEach((entry) => settlePanel(entry, true));
});
window.addEventListener("afterprint", finishPanelTransitions);

const siteHeader = document.querySelector(".site-header");
const primaryNav = document.querySelector(".nav");
const sectionLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const sectionTargets = sectionLinks.map((link) => ({
    link,
    section: document.getElementById(link.getAttribute("href").slice(1)),
})).filter((target) => target.section);

if (siteHeader && primaryNav && sectionTargets.length) {
    const indicator = document.createElement("span");
    indicator.className = "nav-indicator";
    indicator.setAttribute("aria-hidden", "true");
    primaryNav.append(indicator);

    let isTicking = false;
    let previousHeaderHeight = 0;
    let indicatorInitialized = false;

    const placeIndicator = (link) => {
        const range = document.createRange();
        range.selectNodeContents(link.querySelector(".nav-label") || link);
        const textBox = range.getBoundingClientRect();
        const navBox = primaryNav.getBoundingClientRect();

        if (!textBox.width || !textBox.height) return;

        const width = textBox.width.toFixed(2) + "px";
        const x = (textBox.left - navBox.left).toFixed(2);
        const y = (textBox.bottom - navBox.top + 5).toFixed(2);
        const transform = `translate(${x}px, ${y}px)`;

        if (indicator.style.width !== width) indicator.style.width = width;
        if (indicator.style.transform !== transform) indicator.style.transform = transform;

        if (!indicatorInitialized) {
            indicatorInitialized = true;
            primaryNav.classList.add("has-indicator");
            // Paint the initial position without flying in from the left edge.
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => indicator.classList.add("is-ready"));
            });
        }
    };

    const updateHeader = () => {
        const headerHeight = Math.ceil(siteHeader.getBoundingClientRect().height);
        if (headerHeight !== previousHeaderHeight) {
            previousHeaderHeight = headerHeight;
            document.documentElement.style.setProperty("--header-height", headerHeight + "px");
        }
        siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);

        let current = sectionTargets[0];
        sectionTargets.forEach((target) => {
            if (target.section.getBoundingClientRect().top <= headerHeight + 80) {
                current = target;
            }
        });

        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) {
            current = sectionTargets[sectionTargets.length - 1];
        }

        sectionTargets.forEach((target) => {
            if (target === current) {
                if (target.link.getAttribute("aria-current") !== "location") {
                    target.link.setAttribute("aria-current", "location");
                }
            } else {
                target.link.removeAttribute("aria-current");
            }
        });

        placeIndicator(current.link);
        isTicking = false;
    };

    const scheduleUpdate = () => {
        if (isTicking) return;
        isTicking = true;
        window.requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("hashchange", scheduleUpdate);

    if ("ResizeObserver" in window) {
        new ResizeObserver(scheduleUpdate).observe(siteHeader);
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleUpdate);
    }
}
