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

export async function loadNotifications(container) {
  if (!container) return;

  container.innerHTML = "Loading...";

  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          container.innerHTML = "Please sign in to view notifications.";
          resolve();
          return;
        }

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
          container.innerHTML = "No notifications yet";
          resolve();
          return;
        }

        for (const notifDoc of snapshot.docs) {
          const notif = notifDoc.data();

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
            document.createElement("div");

          if (notif.type === "follow") {
            div.innerHTML =
              `<p><strong>${senderName}</strong> followed you</p>`;
          } else if (notif.type === "like") {
            div.innerHTML =
              `<p><strong>${senderName}</strong> liked your post ❤️</p>`;
          } else if (notif.type === "comment") {
            div.innerHTML =
              `<p><strong>${senderName}</strong> commented on your post 💬</p>`;
          } else {
            div.innerHTML =
              `<p><strong>${senderName}</strong> sent a notification</p>`;
          }

          container.appendChild(div);
        }

        resolve();
      } catch (error) {
        console.error("Error loading notifications:", error);
        container.innerHTML = "Failed to load notifications.";
        resolve();
      }
    });
  });
}
