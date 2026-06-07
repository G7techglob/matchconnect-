import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
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

async function loadPosts() {

  postsContainer.innerHTML = "";

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {

    const post = doc.data();

    postsContainer.innerHTML += `
      <div class="post">
        <p>${post.content}</p>
      </div>
    `;

  });

}

postBtn.addEventListener("click", async () => {

  const content = postContent.value.trim();

  if (!content) return;

  await addDoc(collection(db, "posts"), {
    content,
    createdAt: new Date()
  });

  postContent.value = "";

  loadPosts();

});

loadPosts();
