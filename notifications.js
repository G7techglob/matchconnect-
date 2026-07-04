import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
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

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          container.textContent = "No notifications yet";
          unsubscribe();
          resolve();
          return;
        }

        const senderIds = [...new Set(snapshot.docs.map((d) => d.data()?.senderId).filter(Boolean))];

        const senderEntries = await Promise.all(
          senderIds.map(async (senderId) => {
            try {
              const senderSnap = await getDoc(doc(db, "users", senderId));
              const name = senderSnap.exists() ? senderSnap.data()?.name || "Someone" : "Someone";
              return [senderId, name];
            } catch {
              return [senderId, "Someone"];
            }
          })
        );

        const senderCache = new Map(senderEntries);

        const fragment = document.createDocumentFragment();

        for (const notifDoc of snapshot.docs) {
          const notif = notifDoc.data();
          const senderName = senderCache.get(notif?.senderId) || "Someone";

          const wrapper = document.createElement("div");
          wrapper.className = "notification-item";

          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = senderName;

          p.appendChild(strong);
          p.append(buildNotificationText(notif?.type));

          wrapper.appendChild(p);
          fragment.appendChild(wrapper);
        }

        container.appendChild(fragment);

        unsubscribe();
        resolve();
      } catch (error) {
        console.error("Error loading notifications:", error);

        if (String(error?.message || "").includes("index")) {
          container.textContent =
            "Notifications need a Firestore index (userId + createdAt). Check console for the direct index link.";
        } else {
          container.textContent = "Failed to load notifications.";
        }

        unsubscribe();
        resolve();
      }
    });
  });
}
