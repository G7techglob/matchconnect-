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

// =====================================================
// ADVERTISEMENT BILLBOARD
// =====================================================

const ads = [

    {
        image:
            "https://picsum.photos/800/200?random=1",

        link:
            "https://example.com/ad1"
    },

    {
        image:
            "https://picsum.photos/800/200?random=2",

        link:
            "https://example.com/ad2"
    },

    {
        image:
            "https://picsum.photos/800/200?random=3",

        link:
            "https://example.com/ad3"
    }

];


let currentAd = 0;


function loadAd() {

    const adImage =
        document.getElementById("adImage");

    const adLink =
        document.getElementById("adLink");


    if (!adImage || !adLink) {

        return;
    }


    adImage.src =
        ads[currentAd].image;


    adLink.href =
        ads[currentAd].link;

}


loadAd();


setInterval(() => {

    currentAd =
        (currentAd + 1) % ads.length;

    loadAd();

}, 10000);
