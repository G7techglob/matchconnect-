import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyCVdy9nJLp3YDV9PNB9kfR3HiQCdFdvGmg",
  authDomain: "matchconnect-44a3e.firebaseapp.com",
  projectId: "matchconnect-44a3e",
  storageBucket: "matchconnect-44a3e.firebasestorage.app",
  messagingSenderId: "283382943870",
  appId: "1:283382943870:web:ee1d08c65bcbac400cc82f"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

auth.onAuthStateChanged(
  async (user) => {

    if (!user) {

      window.location.href =
        "login.html";

      return;

    }

    const userDoc =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );

    if (!userDoc.exists())
      return;

    const data =
      userDoc.data();

    document.getElementById(
      "profileName"
    ).textContent =
      data.name || "No Name";

    document.getElementById(
      "profileEmail"
    ).textContent =
      data.email || "";

    document.getElementById(
  "profileBio"
).textContent =
  data.bio || "No bio yet";

    document.getElementById(
  "editName"
).value =
  data.name || "";

document.getElementById(
  "editBio"
).value =
  data.bio || "";
  }
);
