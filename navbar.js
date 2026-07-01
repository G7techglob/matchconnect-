document.addEventListener("DOMContentLoaded", async () => {
    const navbarContainer = document.getElementById("navbar-container");

    if (navbarContainer) {
        const response = await fetch("navbar.html");
        const navbar = await response.text();
        navbarContainer.innerHTML = navbar;
    }
});
