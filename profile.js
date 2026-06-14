import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp
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

console.log("PROFILE PAGE STARTED");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found");
      return;
    }

    const data =
      userSnap.data();

    document.getElementById(
      "profileName"
    ).textContent =
      data.name || "No Name";

    document.getElementById(
      "profileEmail"
    ).textContent =
      data.email || user.email;

    document.getElementById(
      "profileBio"
    ).textContent =
      data.bio || "No bio yet";

    document.getElementById(
      "profilePhoto"
    ).src =
      data.photoURL ||
      "images/default-avatar.png";

    document.getElementById(
      "editName"
    ).value =
      data.name || "";

    document.getElementById(
      "editBio"
    ).value =
      data.bio || "";

    document.getElementById(
      "photoURLInput"
    ).value =
      data.photoURL || "";

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

});

const saveBtn =
  document.getElementById(
    "saveProfileBtn"
  );

if (saveBtn) {

  saveBtn.addEventListener(
    "click",
    async () => {

      const user =
        auth.currentUser;

      if (!user) return;

      const name =
        document.getElementById(
          "editName"
        ).value.trim();

      const bio =
        document.getElementById(
          "editBio"
        ).value.trim();

      const photoURL =
        document.getElementById(
          "photoURLInput"
        ).value.trim();

      try {

        await updateDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            name,
            bio,
            photoURL
          }
        );

        alert(
          "Profile updated successfully!"
        );

        location.reload();

      } catch (error) {

        console.error(error);
        alert(error.message);

      }

    }
  );

}

const profilePostBtn =
  document.getElementById("profilePostBtn");

if (profilePostBtn) {

  profilePostBtn.addEventListener(
    "click",
    async () => {

      const user =
        auth.currentUser;

      if (!user) {
        alert("Please login");
        return;
      }

      const content =
        document.getElementById(
          "profilePostContent"
        ).value.trim();

      if (!content) {
        alert("Write something first");
        return;
      }

      try {

        const userSnap =
          await getDoc(
            doc(
              db,
              "users",
              user.uid
            )
          );

        const profileData =
          userSnap.data();

        await addDoc(
          collection(db, "posts"),
          {
            content,
            userId: user.uid,
            username:
              profileData.name ||
              user.email,
            photoURL:
              profileData.photoURL ||
              "images/default-avatar.png",
            likes: 0,
            comments: 0,
            createdAt:
              serverTimestamp()
          }
        );

        alert("Post created!");

        document.getElementById(
          "profilePostContent"
        ).value = "";

      } catch (error) {

        console.error(error);
        alert(error.message);

      }

    }
  );

}
