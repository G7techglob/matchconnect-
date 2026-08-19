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

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
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

    case "live":
      return " is LIVE 🔴";

    default:
      return " sent a notification";
  }
}

export function loadNotifications(container) {
  if (!container) return () => {};

  container.textContent = "Loading...";

  let unsubscribeSnapshot = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    try {
      if (!user) {
        container.textContent = "Please sign in to view notifications.";
        return;
      }

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        async (snapshot) => {
          container.innerHTML = "";

          if (snapshot.empty) {
            container.textContent = "No notifications yet";
            return;
          }

          const senderIds = [
            ...new Set(
              snapshot.docs.map((d) => d.data().senderId).filter(Boolean)
            )
          ];

          const senderCache = new Map();

          await Promise.all(
            senderIds.map(async (senderId) => {
              try {
                const senderSnap = await getDoc(doc(db, "users", senderId));
                senderCache.set(
  senderId,
  senderSnap.exists()
    ? {
        name: senderSnap.data().name || "Someone",
        photoURL: senderSnap.data().photoURL || "default-avatar.png"
      }
    : {
        name: "Someone",
        photoURL: "default-avatar.png"
      }
);
              } catch {
                senderCache.set(senderId, "Someone");
              }
            })
          );

          snapshot.forEach((notificationDoc) => {
            const notification = notificationDoc.data();

            const sender =
  senderCache.get(notification.senderId) || {
    name: "Someone",
    photoURL: "default-avatar.png"
  };

const wrapper = document.createElement("div");

wrapper.className = "notification-card";

wrapper.innerHTML = `
  <div class="notification-avatar">
    <img
      src="${sender.photoURL}"
      alt="${sender.name}"
      class="sender-photo">
  </div>

  <div class="notification-content">
    <h4 class="sender-name">
      ${sender.name}
    </h4>

    <p>${buildNotificationText(notification.type)}</p>

    <span class="notification-time">
      Just now
    </span>
  </div>
`;
            const senderPhoto = wrapper.querySelector(".sender-photo");
const senderName = wrapper.querySelector(".sender-name");

senderPhoto.addEventListener("click", (e) => {
  e.stopPropagation();

  if (notification.type === "follow") {
    window.location.href = `user.html?uid=${notification.senderId}`;
  } else {
    window.location.href = `post.html?id=${notification.postId}`;
  }
});

senderName.addEventListener("click", (e) => {
  e.stopPropagation();

  if (notification.type === "follow") {
    window.location.href = `user.html?uid=${notification.senderId}`;
  } else {
    window.location.href = `post.html?id=${notification.postId}`;
  }
});
            wrapper.style.cursor = "pointer";

wrapper.addEventListener("click", () => {

  if (notification.type === "follow") {

    window.location.href =
      `user.html?uid=${notification.senderId}`;

  } else if (notification.type === "like") {

    window.location.href =
      `post.html?id=${notification.postId}`;

  } else if (notification.type === "comment") {

    window.location.href =
      `post.html?id=${notification.postId}#comments`;

  } else if (notification.type === "live") {

    if (!notification.streamId) {
      console.error("Live notification has no streamId.");
      return;
    }

    window.location.href =
      `watch-live.html?streamId=${encodeURIComponent(
        notification.streamId
      )}`;

  }

});

            container.appendChild(wrapper);
          });
        },
        (error) => {
          console.error("Error in notifications snapshot:", error);
          if (String(error?.message || "").includes("index")) {
            container.textContent =
              "Notifications need a Firestore index (userId + createdAt). Check console for the direct index link.";
          } else {
            container.textContent = "Failed to load notifications.";
          }
        }
      );
    } catch (error) {
      console.error("Error loading notifications:", error);
      container.textContent = "Failed to load notifications.";
    }
  });

  return () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeAuth();
  };
}

const container = document.getElementById("notificationsContainer");
const cleanupNotifications = loadNotifications(container);

window.addEventListener("beforeunload", cleanupNotifications);
