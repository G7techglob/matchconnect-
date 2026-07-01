document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("navbar-container");

    if (!container) {
        console.log("Navbar container not found");
        return;
    }

    try {
        const res = await fetch("./navbar.html");

        if (!res.ok) {
            console.log("Failed to load navbar.html");
            return;
        }

        const html = await res.text();
        container.innerHTML = html;

    } catch (error) {
        console.log("Navbar error:", error);
    }
});
