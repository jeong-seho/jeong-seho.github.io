document.querySelectorAll(".abstract-button").forEach((button) => {
    const panelId = button.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);

    if (!panel) return;

    button.addEventListener("click", () => {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        const willExpand = !isExpanded;

        button.setAttribute("aria-expanded", String(willExpand));
        panel.hidden = isExpanded;
        button.closest(".paper-card")?.classList.toggle("has-expanded-abstract", willExpand);
    });
});

const siteHeader = document.querySelector(".site-header");

if (siteHeader) {
    let isTicking = false;

    const updateHeader = () => {
        siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
        isTicking = false;
    };

    const handleScroll = () => {
        if (isTicking) return;

        window.requestAnimationFrame(updateHeader);
        isTicking = true;
    };

    updateHeader();
    window.addEventListener("scroll", handleScroll, { passive: true });
}
