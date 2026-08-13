import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
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
const db = getFirestore(app);

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", async () => {

    const searchText = searchInput.value
        .trim()
        .toLowerCase();

    searchResults.innerHTML = "";

    if (!searchText) return;

    let found = false;

    // ==========================
    // SEARCH USERS
    // ==========================

    const usersSnapshot = await getDocs(collection(db, "users"));

    usersSnapshot.forEach((userDoc) => {

        const user = userDoc.data();

        const username = (user.username || "").toLowerCase();
        const name = (user.name || "").toLowerCase();

        if (
            username.includes(searchText) ||
            name.includes(searchText)
        ) {

            found = true;

            const div = document.createElement("div");
            div.className = "search-result";

            div.innerHTML = `
                <a href="profile.html?uid=${userDoc.id}">
                    <i class="fa-solid fa-user"></i>
                    <strong>${user.username || user.name || "User"}</strong>
                </a>
            `;

            searchResults.appendChild(div);
        }

    });

    // ==========================
    // SEARCH POSTS
    // ==========================

    const postsSnapshot = await getDocs(collection(db, "posts"));

    postsSnapshot.forEach((postDoc) => {

        const post = postDoc.data();

        const content = (post.content || "").toLowerCase();

        if (content.includes(searchText)) {

            found = true;

            const div = document.createElement("div");
            div.className = "search-result";

            const preview =
                post.content.length > 100
                    ? post.content.substring(0, 100) + "..."
                    : post.content;

            div.innerHTML = `
                <a href="post.html?id=${postDoc.id}">
                    <i class="fa-solid fa-file-lines"></i>
                    <p>${preview}</p>
                    <small>by ${post.username || "User"}</small>
                </a>
            `;

            searchResults.appendChild(div);
        }

    });

    if (!found) {

        searchResults.innerHTML = `
            <div class="search-result">
                <i class="fa-solid fa-circle-info"></i>
                No users or posts found.
            </div>
        `;

    }

});
