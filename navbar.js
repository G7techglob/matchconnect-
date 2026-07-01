document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("navbar-container");

    if (!container) return;

    try {
        const response = await fetch("./navbar.html", {
            cache: "no-store"
        });

        const html = await response.text();
        container.innerHTML = html;

    } catch (err) {
        console.log("Navbar load error:", err);
    }
});
