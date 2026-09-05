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
const navFilterImage = document.getElementById("liquid-glass-nav-image");

const smoothstep = (start, end, value) => {
    const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return progress * progress * (3 - 2 * progress);
};

const buildNavDisplacementMap = () => {
    const mapHeight = 64;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return "";

    canvas.width = 1;
    canvas.height = mapHeight;

    const image = context.createImageData(1, mapHeight);
    const activeZone = 0.28;

    for (let y = 0; y < mapHeight; y += 1) {
        const normalizedY = y / (mapHeight - 1);
        const distanceFromEdge = Math.min(normalizedY, 1 - normalizedY);
        const pixelIndex = y * 4;
        let green = 128;

        if (distanceFromEdge < activeZone) {
            const strength = smoothstep(activeZone, 0, distanceFromEdge);
            const direction = normalizedY < 0.5 ? 1 : -1;
            green = Math.round(128 + direction * strength * 92);
        }

        image.data[pixelIndex] = 128;
        image.data[pixelIndex + 1] = green;
        image.data[pixelIndex + 2] = 0;
        image.data[pixelIndex + 3] = 255;
    }

    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
};

const updateNavRefraction = () => {
    if (!siteHeader || !navFilterImage) return;

    const bounds = siteHeader.getBoundingClientRect();
    const displacementMap = buildNavDisplacementMap();

    if (!displacementMap || bounds.width < 1 || bounds.height < 1) return;

    navFilterImage.setAttribute("width", String(Math.round(bounds.width)));
    navFilterImage.setAttribute("height", String(Math.round(bounds.height)));
    navFilterImage.setAttribute("href", displacementMap);
};

if (siteHeader) {
    let isTicking = false;
    let resizeTimer;

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
    updateNavRefraction();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(updateNavRefraction, 80);
    }, { passive: true });
}
