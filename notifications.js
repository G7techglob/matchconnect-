import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { app, auth } from "./firebase.js";

const db = getFirestore(app);

function buildNotificationText(type) {
  switch (type) {
    case "follow":
      return " followed you";
    case "like":
      return " liked your post ❤️";
    case "comment":
      return " commented on your post 💬";
    default:
      return " sent a notification";
  }
}

export async function loadNotifications(container) {
  if (!container) return;

  container.textContent = "Loading...";

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          container.textContent = "Please sign in to view notifications.";
          unsubscribe();
          resolve();
          return;
        }

        container.textContent = "";

        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        onSnapshot(q, async (snapshot) => {

  container.innerHTML = "";

  if (snapshot.empty) {
    container.textContent = "No notifications yet";
    return;
  }

  const senderIds = [
    ...new Set(
      snapshot.docs
        .map(doc => doc.data().senderId)
        .filter(Boolean)
    )
  ];

  const senderCache = new Map();

  for (const senderId of senderIds) {
    try {
      const senderSnap = await getDoc(doc(db, "users", senderId));

      senderCache.set(
        senderId,
        senderSnap.exists()
          ? (senderSnap.data().name || "Someone")
          : "Someone"
      );
    } catch {
      senderCache.set(senderId, "Someone");
    }
  }

  snapshot.forEach((notificationDoc) => {

    const notification = notificationDoc.data();

    const wrapper = document.createElement("div");
    wrapper.className = "notification-item";

    wrapper.innerHTML = `
      <p>
        <strong>${senderCache.get(notification.senderId) || "Someone"}</strong>
        ${buildNotificationText(notification.type)}
      </p>
    `;

    container.appendChild(wrapper);

  });

});

              resolve();

    } catch (error) {
      console.error("Error loading notifications:", error);

      if (String(error?.message || "").includes("index")) {
        container.textContent =
          "Notifications need a Firestore index (userId + createdAt). Check console for the direct index link.";
      } else {
        container.textContent = "Failed to load notifications.";
      }

      resolve();
    }
  });
});

  const container = document.getElementById("notificationsContainer");

loadNotifications(container);
