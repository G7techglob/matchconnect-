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


const searchInput =
document.getElementById("searchInput");


const searchResults =
document.getElementById("searchResults");



searchInput.addEventListener("input", async()=>{


const searchText =
searchInput.value
.toLowerCase()
.trim();


searchResults.innerHTML = "";


if(!searchText) return;



// ======================
// SEARCH USERS
// ======================

const usersSnapshot =
await getDocs(
collection(db,"users")
);


usersSnapshot.forEach((userDoc)=>{


const user = userDoc.data();


const username =
(user.username || "")
.toLowerCase();



if(username.includes(searchText)){


const div =
document.createElement("div");


div.className="search-result";


div.innerHTML = `

<a href="user.html?uid=${userDoc.id}">

<i class="fa-solid fa-user"></i>

${user.username || "User"}

</a>

`;


searchResults.appendChild(div);


}


});




// ======================
// SEARCH POSTS
// ======================


const postsSnapshot =
await getDocs(
collection(db,"posts")
);


postsSnapshot.forEach((postDoc)=>{


const post =
postDoc.data();


const content =
(post.content || "")
.toLowerCase();



if(content.includes(searchText)){


const div =
document.createElement("div");


div.className="search-result";


div.innerHTML = `

<div>

<i class="fa-solid fa-file-lines"></i>

<p>
${post.content}
</p>

<small>
by ${post.username || "User"}
</small>

</div>

`;


searchResults.appendChild(div);


}


});


});
