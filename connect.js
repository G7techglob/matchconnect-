// =====================================================
// MATCHCONNECT HUB
// =====================================================

console.log("✅ MatchConnect Hub Loaded");

// Optional welcome animation
window.addEventListener("load", () => {

    document.body.style.opacity = "0";

    setTimeout(() => {
        document.body.style.transition = "opacity .4s";
        document.body.style.opacity = "1";
    }, 100);

});

// Highlight the selected card

const cards = document.querySelectorAll(".card");

cards.forEach(card => {

    card.addEventListener("click", () => {

        card.style.transform = "scale(.97)";

        setTimeout(() => {
            card.style.transform = "";
        }, 150);

    });

});
