import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { auth }
from "./firebase.js";

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

auth.onAuthStateChanged(
  async (user) => {

    if (!user) return;

    const container =
      document.getElementById(
        "notificationsContainer"
      );

    container.innerHTML = "";

    const q =
      query(
        collection(
          db,
          "notifications"
        ),
        where(
          "userId",
          "==",
          user.uid
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      container.innerHTML =
        "No notifications yet";

      return;

    }

    for (const notifDoc of snapshot.docs) {

      const notif =
        notifDoc.data();

      const senderDoc =
        await getDoc(
          doc(
            db,
            "users",
            notif.senderId
          )
        );

      const senderName =
        senderDoc.exists()
          ? senderDoc.data().name
          : "Someone";

      const div =
        document.createElement(
          "div"
        );

      if (
  notif.type === "follow"
) {

  div.innerHTML =
    `<p><strong>${senderName}</strong> followed you</p>`;

}

else if (
  notif.type === "like"
) {

  div.innerHTML =
    `<p><strong>${senderName}</strong> liked your post</p>`;

}

else if (
  notif.type === "like"
) {

  div.innerHTML =
    `<p><strong>${senderName}</strong> liked your post ❤️</p>`;

}

      container.appendChild(
        div
      );

    }

  }
);
