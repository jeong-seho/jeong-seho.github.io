// Without JavaScript, the full abstract stays readable and no inert button is shown.
document.querySelectorAll(".abstract-button").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));

    if (!panel) return;

    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.hidden = false;

    button.addEventListener("click", () => {
        const willExpand = button.getAttribute("aria-expanded") !== "true";

        button.setAttribute("aria-expanded", String(willExpand));
        panel.hidden = !willExpand;
    });
});

const siteHeader = document.querySelector(".site-header");
const sectionLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const sectionTargets = sectionLinks.map((link) => ({
    link,
    section: document.getElementById(link.getAttribute("href").slice(1)),
})).filter((target) => target.section);

if (siteHeader) {
    let isTicking = false;

    const updateHeader = () => {
        const headerHeight = Math.ceil(siteHeader.getBoundingClientRect().height);
        document.documentElement.style.setProperty("--header-height", headerHeight + "px");
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
                target.link.setAttribute("aria-current", "location");
            } else {
                target.link.removeAttribute("aria-current");
            }
        });

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
}
