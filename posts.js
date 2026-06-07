

  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVdy9nJLp3YDV9PNB9kfR3HiQCdFdvGmg",
  authDomain: "matchconnect-44a3e.firebaseapp.com",
  projectId: "matchconnect-44a3e",
  storageBucket: "matchconnect-44a3e.firebasestorage.app",
  messagingSenderId: "283382943870",
  appId: "1:283382943870:web:ee1d08c65bcbac400cc82f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const postBtn = document.getElementById("postBtn");
const postContent = document.getElementById("postContent");
const postsContainer = document.getElementById("postsContainer");

// safer loader
async function loadPosts() {
  try {
    const snapshot = await getDocs(collection(db, "posts"));

    postsContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const post = doc.data();

      const div = document.createElement("div");
      div.className = "post";

      div.innerHTML = `
        <p>${post.content}</p>
      `;

      postsContainer.appendChild(div);
    });

  } catch (error) {
    console.error("Load error:", error);
  }
}

// wait until DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  loadPosts();

  postBtn.addEventListener("click", async () => {
    const content = postContent.value.trim();

    if (!content) return;

    try {
      await addDoc(collection(db, "posts"), {
        content,
        createdAt: new Date()
      });

      postContent.value = "";

      // reload feed AFTER saving
      loadPosts();

    } catch (error) {
      console.error("Post error:", error);
    }
  });
});
