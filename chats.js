import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const chatList = document.getElementById("chatList");

const renderLoading = () => {
  chatList.innerHTML = `
    <div style="padding:20px;text-align:center;">Loading chats...</div>
  `;
};

const renderEmpty = () => {
  chatList.innerHTML = `
    <div style="padding:20px;text-align:center;color:#666;">No conversations yet. Start connecting with people!</div>
  `;
};

const formatTime = (ts) => {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch (e) {
    return "";
  }
};

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  renderLoading();

  try {
    // Fetch all users (except current). For each user we fetch the latest message in the chat subcollection.
    const usersSnapshot = await getDocs(collection(db, "users"));

    const conversations = [];

    const fetchLastFor = async (otherDoc) => {
      if (otherDoc.id === user.uid) return null;

      const other = otherDoc.data();
      const otherId = otherDoc.id;

      const chatId = [user.uid, otherId].sort().join("_");
      const messagesRef = collection(db, "chats", chatId, "messages");
      const lastQuery = query(messagesRef, orderBy("time", "desc"), limit(1));

      const lastSnap = await getDocs(lastQuery);
      let last = null;
      if (!lastSnap.empty) {
        const lastDoc = lastSnap.docs[0];
        last = {
          id: lastDoc.id,
          ...lastDoc.data()
        };
      }

      return {
        userId: otherId,
        username: other.username || other.email || "Unknown",
        avatar: other.photoURL || "",
        lastMessage: last,
        lastTime: last && last.time ? (last.time.toDate ? last.time.toDate().getTime() : new Date(last.time).getTime()) : 0
      };
    };

    // Launch parallel fetches (but not too many at once). We'll collect promises and await them all.
    const promises = [];
    usersSnapshot.forEach((doc) => {
      promises.push(fetchLastFor(doc));
    });

    const results = await Promise.all(promises);

    // Filter out nulls and sort by lastTime desc
    const convs = results.filter(Boolean).sort((a, b) => b.lastTime - a.lastTime);

    if (convs.length === 0) {
      renderEmpty();
      return;
    }

    // Render list
    chatList.innerHTML = "";

    convs.forEach((c) => {
      const item = document.createElement("div");
      item.className = "chat-item";
      item.style.cursor = "pointer";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.padding = "10px";
      item.style.borderBottom = "1px solid #eee";

      item.addEventListener("click", () => {
        // navigate to chat page with uid param
        window.location.href = `chat.html?uid=${c.userId}`;
      });

      const avatar = document.createElement("div");
      avatar.className = "chat-avatar";
      avatar.style.width = "48px";
      avatar.style.height = "48px";
      avatar.style.borderRadius = "50%";
      avatar.style.backgroundColor = "#ccc";
      avatar.style.display = "flex";
      avatar.style.alignItems = "center";
      avatar.style.justifyContent = "center";
      avatar.style.marginRight = "12px";
      avatar.style.overflow = "hidden";

      if (c.avatar) {
        const img = document.createElement("img");
        img.src = c.avatar;
        img.alt = c.username;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        avatar.appendChild(img);
      } else {
        avatar.textContent = (c.username || "?").charAt(0).toUpperCase();
        avatar.style.color = "white";
        avatar.style.fontWeight = "600";
        avatar.style.fontSize = "18px";
      }

      const body = document.createElement("div");
      body.style.flex = "1";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.alignItems = "center";

      const name = document.createElement("div");
      name.textContent = c.username;
      name.style.fontWeight = "600";

      const time = document.createElement("div");
      time.style.fontSize = "12px";
      time.style.color = "#888";
      time.textContent = c.lastMessage ? formatTime(c.lastMessage.time) : "";

      top.appendChild(name);
      top.appendChild(time);

      const bottom = document.createElement("div");
      bottom.style.display = "flex";
      bottom.style.justifyContent = "space-between";
      bottom.style.alignItems = "center";

      const preview = document.createElement("div");
      preview.style.color = "#555";
      preview.style.fontSize = "14px";
      preview.style.marginTop = "4px";
      preview.textContent = c.lastMessage ? (c.lastMessage.text ? c.lastMessage.text : "(attachment)") : "Say hi!";

      bottom.appendChild(preview);

      body.appendChild(top);
      body.appendChild(bottom);

      item.appendChild(avatar);
      item.appendChild(body);

      chatList.appendChild(item);
    });

  } catch (error) {
    console.error("Failed to load chats:", error);
    chatList.innerHTML = `
      <div style="padding:20px;color:red;text-align:center;">Failed to load chats.</div>
    `;
  }
});
