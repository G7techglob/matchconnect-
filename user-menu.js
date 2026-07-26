document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("userMenuContainer");

    if (!container) return;

    const response = await fetch("user-menu.html");
    container.innerHTML = await response.text();

    const menuBtn = document.getElementById("menuBtn");
    const profileMenu = document.getElementById("profileMenu");

    if (menuBtn && profileMenu) {

        // Open menu
        menuBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            profileMenu.classList.toggle("show");

        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {

            if (
                !profileMenu.contains(e.target) &&
                !menuBtn.contains(e.target)
            ) {

                profileMenu.classList.remove("show");

            }

        });

    }

});
