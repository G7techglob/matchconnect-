document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("navbar-container");
    if (!container) return;

    const basePath = window.location.pathname
        .includes("/")
        ? ""
        : "";

    try {
        const response = await fetch(basePath + "navbar.html");
        const html = await response.text();
        container.innerHTML = html;
    } catch (err) {
        console.log("Navbar load error:", err);
    }

});
