
document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("navbar-container");

    if (!container) {
        console.log("Navbar container not found");
        return;
    }

    try {

        const response = await fetch("navbar.html");

        if (!response.ok) {
            console.log("Navbar fetch failed:", response.status);
            return;
        }

        const html = await response.text();

        container.innerHTML = html;

        console.log("Navbar loaded successfully");

    } catch (err) {

        console.log("Navbar error:", err);

    }

});
