import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment,
  orderBy
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

const auth = getAuth(app);

const db = getFirestore(app);
console.log("PROFILE JS LOADED");

auth.onAuthStateChanged(
  async (user) => {

    if (!user) {

      window.location.href =
        "login.html";

      return;

    }

    const userDoc =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )

        
      );

    if (!userDoc.exists())
      return;

    const data =
      userDoc.data();
    
    console.log("USER DATA LOADED");

    document.getElementById(
      "profileName"
    ).textContent =
      data.name || "No Name";

    document.getElementById(
      "profileEmail"
    ).textContent =
      data.email || "";

    document.getElementById(
  "profileBio"
).textContent =
  data.bio || "No bio yet";

    document.getElementById(
  "profilePhoto"
).src =
  data.photoURL ||
  "images/default-avatar.png";

    document.getElementById(
  "editName"
).value =
  data.name || "";

document.getElementById(
  "editBio"
).value =
  data.bio || "";
    
   document.getElementById(
  "photoURLInput"
).value =
  data.photoURL || ""; 

    const followersSnapshot =
  await getDocs(
    collection(
      db,
      "users",
      user.uid,
      "followers"
    )
  );

document.getElementById(
  "followersCount"
).textContent =
  followersSnapshot.size;

let followingCount = 0;

const usersSnapshot =
  await getDocs(
    collection(db, "users")
  );

for (const userDoc of usersSnapshot.docs) {

  const followCheck =
    await getDoc(
      doc(
        db,
        "users",
        userDoc.id,
        "followers",
        user.uid
      )
    );

  if (followCheck.exists()) {
    followingCount++;
  }

}

document.getElementById(
  "followingCount"
).textContent =
  followingCount;

    const myPostsContainer =
  document.getElementById(
    "myPosts"
  );

myPostsContainer.innerHTML = "";

const postsQuery =
  query(
    collection(db, "posts"),
    where(
      "userId",
      "==",
      user.uid
    )
  );

const postsSnapshot =
  await getDocs(postsQuery);

postsSnapshot.forEach(
  (postDoc) => {

    const post =
      postDoc.data();

    const div =
      document.createElement("div");

    div.innerHTML = `
  <p>${post.content}</p>

  ❤️ ${post.likes || 0}
  💬 ${post.comments || 0}

  <div
    class="comments-list"
    id="comments-${postDoc.id}">
  </div>

  <input
    type="text"
    class="comment-input"
    data-id="${postDoc.id}"
    placeholder="Write a comment..."
  >

  <button
    class="send-comment-btn"
    data-id="${postDoc.id}">
    Send
  </button>

  <hr>
`;

    myPostsContainer.appendChild(div);

    const commentsContainer =
  div.querySelector(
    `#comments-${postDoc.id}`
  );

const commentsSnapshot =
  await getDocs(
    collection(
      db,
      "posts",
      postDoc.id,
      "comments"
    )
  );

commentsSnapshot.forEach(
  (commentDoc) => {

    const comment =
      commentDoc.data();

    const p =
      document.createElement("p");

    p.innerHTML =
      `<strong>${comment.username}</strong>: ${comment.text}`;

    commentsContainer.appendChild(p);

  }
);

  }
);



    document.getElementById(
  "profilePostBtn"
).addEventListener(
  "click",
  async () => {

    const content =
      document.getElementById(
        "profilePostContent"
      ).value.trim();

    if (!content) return;

    const profileData =
      data;

    await addDoc(
      collection(db, "posts"),
      {
        content,
        userId: user.uid,
        username:
          profileData.name ||
          user.email,
        photoURL:
          profileData.photoURL ||
          "images/default-avatar.png",
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      }
    );

    location.reload();

  }
);
    
    
  }
);


document.addEventListener(
  "click",
  async (e) => {

    if (
      !e.target.classList.contains(
        "send-comment-btn"
      )
    ) return;

    const user =
      auth.currentUser;

    if (!user) return;

    const postId =
      e.target.dataset.id;

    const input =
      document.querySelector(
        `.comment-input[data-id="${postId}"]`
      );

    const text =
      input.value.trim();

    if (!text) return;

    const userDoc =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );

    const profileData =
      userDoc.data();

    await addDoc(
      collection(
        db,
        "posts",
        postId,
        "comments"
      ),
      {
        text,
        userId: user.uid,
        username:
          profileData.name ||
          user.email,
        createdAt:
          serverTimestamp()
      }
    );

    await updateDoc(
      doc(
        db,
        "posts",
        postId
      ),
      {
        comments:
          increment(1)
      }
    );

    location.reload();

  }
);



document.getElementById(
  "saveProfileBtn"
).addEventListener(
  "click",
  async () => {

    

    const user =
      auth.currentUser;

    if (!user) return;

    const name =
      document.getElementById(
        "editName"
      ).value.trim();

    const bio =
      document.getElementById(
        "editBio"
      ).value.trim();

    const photoURL =
  document.getElementById(
    "photoURLInput"
  ).value.trim();

    try {

      await updateDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
  name,
  bio,
  photoURL
        }
      );

      alert(
        "Profile updated!"
      );

      location.reload();

    } catch (error) {

      console.error(error);

      alert(
        error.message
      );

    }

  }
);
