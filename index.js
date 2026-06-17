
const profilesContainer = document.getElementById("profiles");


/* SEARCH */

const searchInput = document.querySelector(".search-box input");

if (searchInput) {

  searchInput.addEventListener("keyup", () => {

    const value = searchInput.value.toLowerCase();

    const allProfiles =
      document.querySelectorAll(".profile-item");

    allProfiles.forEach(profile => {

      const text =
        profile.innerText.toLowerCase();

      if (text.includes(value)) {

        profile.style.display = "block";

      } else {

        profile.style.display = "none";

      }

    });

  });

}

/* MENU */

const menuBtn =
  document.getElementById("menuBtn");

const mobileNavbar =
  document.getElementById("mobileNavbar");

if (menuBtn && mobileNavbar) {

  menuBtn.addEventListener("click", () => {

    mobileNavbar.classList.toggle("active");

    if (mobileNavbar.classList.contains("active")) {

      history.pushState(
        { menu: true },
        ""
      );

    }

  });

  /* BACK BUTTON */

  window.addEventListener("popstate", () => {

    if (mobileNavbar.classList.contains("active")) {

      mobileNavbar.classList.remove("active");

    }

  });

  /* TAP SCREEN TO CLOSE */

  document.addEventListener("click", (e) => {

    if (
      !mobileNavbar.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {

      mobileNavbar.classList.remove("active");

    }

  });

}

/* START BUTTON */

const startBtn =
  document.getElementById("startBtn");

if (startBtn) {

  startBtn.addEventListener("click", () => {

    window.location.href = "connect.html";

  });

}

/* INITIAL LOAD */

loadProfiles();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("Service Worker Registered"));
  });
}

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request));
});



let currentAd = 0;

function loadAd() {
  document.getElementById("adImage").src =
    ads[currentAd].image;

  document.getElementById("adLink").href =
    ads[currentAd].link;
}

loadAd();

setInterval(() => {
  currentAd =
    (currentAd + 1) % ads.length;

  loadAd();
}, 10000);

const ads = [
  {
    image: "https://picsum.photos/800/200?random=1",
    link: "https://example.com/ad1"
  },
  {
    image: "https://picsum.photos/800/200?random=2",
    link: "https://example.com/ad2"
  },
  {
    image: "https://picsum.photos/800/200?random=3",
    link: "https://example.com/ad3"
  }
];
