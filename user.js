import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc
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

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

const params =
  new URLSearchParams(
    window.location.search
  );

const uid =
  params.get("uid");

if (uid) {

  const userDoc =
    await getDoc(
      doc(
        db,
        "users",
        uid
      )
    );

  if (userDoc.exists()) {

    const data =
      userDoc.data();

    document.getElementById(
      "userPhoto"
    ).src =
      data.photoURL ||
      "images/default-avatar.png";

    document.getElementById(
      "userName"
    ).textContent =
      data.name ||
      "No Name";

    document.getElementById(
      "userBio"
    ).textContent =
      data.bio ||
      "No bio yet";

  }

}
