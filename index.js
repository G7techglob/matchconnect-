const profiles = [

  {
    name: "Sophia",
    age: 24,
    city: "Tripoli",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    bio: "Loves fashion and travelling."
  },

  {
    name: "Daniel",
    age: 27,
    city: "Benghazi",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800",
    video: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    bio: "Fitness lover and entrepreneur."
  },

  {
    name: "Amara",
    age: 22,
    city: "Misrata",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800",
    video: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    bio: "Dancer and social media creator."
  }

];

const profilesContainer = document.getElementById("profiles");

/* LOAD PROFILES */

function loadProfiles() {

  profilesContainer.innerHTML = "";

  profiles.forEach(profile => {

    profilesContainer.innerHTML += `

      <div class="profile-item">

        <img src="${profile.image}" alt="${profile.name}">

        <div class="profile-content">

          <h3>${profile.name}, ${profile.age}</h3>

          <p>📍 ${profile.city}</p>

          <p>${profile.bio}</p>

          <div class="profile-buttons">

            <a href="${profile.image}" target="_blank" class="photo-btn">
              View Photo
            </a>

            <a href="${profile.video}" target="_blank" class="video-btn">
              Watch Video
            </a>

          </div>

        </div>

      </div>

    `;

  });

}

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
