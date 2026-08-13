import { auth } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// LOAD CREATE POST COMPONENT
// =====================================================

async function loadCreatePost() {

  try {

    const container =
      document.getElementById("create-post-container");

    if (!container) {

      console.error(
        "❌ Create Post container not found."
      );

      return;
    }


    const response =
      await fetch("./create-post.html");


    if (!response.ok) {

      throw new Error(
        `Failed to load create-post.html: ${response.status}`
      );

    }


    const html =
      await response.text();


    container.innerHTML = html;


    console.log(
      "✅ Create Post HTML loaded."
    );


    // =====================================================
    // LOAD CREATE POST JAVASCRIPT
    // =====================================================

    const script =
      document.createElement("script");

    script.type = "module";

    script.src = "./create-post.js";


    document.body.appendChild(script);


  } catch (error) {

    console.error(
      "❌ Failed to load Create Post:",
      error
    );

  }

}


// Start Create Post

loadCreatePost();


// =====================================================
// CHECK LOGIN STATUS
// =====================================================

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href =
      "login.html";

    return;
  }

});


// =====================================================
// MENU
// =====================================================

const menuBtn =
  document.getElementById("menuBtn");

const mobileNavbar =
  document.getElementById("mobileNavbar");


if (menuBtn && mobileNavbar) {

  menuBtn.addEventListener("click", () => {

    mobileNavbar.classList.toggle("active");


    if (
      mobileNavbar.classList.contains("active")
    ) {

      history.pushState(
        { menu: true },
        ""
      );

    }

  });


  // =====================================================
  // BACK BUTTON
  // =====================================================

  window.addEventListener("popstate", () => {

    if (
      mobileNavbar.classList.contains("active")
    ) {

      mobileNavbar.classList.remove("active");

    }

  });


  // =====================================================
  // TAP SCREEN TO CLOSE
  // =====================================================

  document.addEventListener("click", (e) => {

    if (
      !mobileNavbar.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {

      mobileNavbar.classList.remove("active");

    }

  });

}


// =====================================================
// START BUTTON
// =====================================================

const startBtn =
  document.getElementById("startBtn");


if (startBtn) {

  startBtn.addEventListener("click", () => {

    window.location.href =
      "connect.html";

  });

}


// =====================================================
// SETTINGS BUTTON
// =====================================================

const settingsBtn =
  document.getElementById("settingsBtn");


if (settingsBtn) {

  settingsBtn.addEventListener("click", () => {

    window.location.href =
      "settings.html";

  });

}


// =====================================================
// INITIAL LOAD
// =====================================================

if (
  typeof loadProfiles === "function"
) {

  loadProfiles();

}

// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
  document.getElementById(
    "desktopLogoutBtn"
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);


        alert(
          "Logged out successfully."
        );


        window.location.href =
          "login.html";


      } catch (error) {

        alert(
          error.message
        );

      }

    }
  );

}
