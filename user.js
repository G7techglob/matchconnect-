import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { auth } from "./firebase.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  setDoc,
  deleteDoc
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

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

const params =
  new URLSearchParams(
    window.location.search
  );

const uid =
  params.get("uid");

if (uid) {

  const userDoc =
    await getDoc(
      doc(
        db,
        "users",
        uid
      )
    );

  if (userDoc.exists()) {

    const data =
      userDoc.data();

    document.getElementById(
      "userPhoto"
    ).src =
      data.photoURL ||
      "images/default-avatar.png";

    document.getElementById(
      "userName"
    ).textContent =
      data.name ||
      "No Name";

    document.getElementById(
      "userBio"
    ).textContent =
      data.bio ||
      "No bio yet";


    const postsQuery =
  query(
    collection(db, "posts"),
    where(
      "userId",
      "==",
      uid
    )
  );

const postsSnapshot =
  await getDocs(postsQuery);

const postsContainer =
  document.getElementById(
    "userPosts"
  );

postsContainer.innerHTML = "";

postsSnapshot.forEach(
  (postDoc) => {

    const post =
      postDoc.data();

    const div =
      document.createElement("div");

    div.innerHTML = `

<div class="post-header">

  <img
    src="${post.photoURL || 'images/default-avatar.png'}"
    class="post-avatar"
    width="50"
  >

  <span class="post-user">
    ${post.username || "User"}
  </span>

</div>

<p>
  ${post.content}
</p>

<div class="post-actions">

  <button
  class="like-btn"
  data-id="${postDoc.id}">
  ❤️ ${post.likes || 0}
</button>

<button
  class="comment-btn"
  data-id="${postDoc.id}">
  💬 ${post.comments || 0}
</button>

<button
  class="share-btn"
  data-id="${postDoc.id}">
  🔄 Share
</button>

</div>

<hr>

`;
    postsContainer.appendChild(
      div
    );

  }
);

  }

}

document.addEventListener(
  "click",
  async (e) => {

    if (
      !e.target.classList.contains(
        "like-btn"
      )
    ) return;

    const user =
      auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const postId =
      e.target.dataset.id;

    const likeRef =
      doc(
        db,
        "posts",
        postId,
        "likes",
        user.uid
      );

    try {

      const existingLike =
        await getDoc(likeRef);

      if (
        existingLike.exists()
      ) {

        await deleteDoc(
          likeRef
        );

        await updateDoc(
          doc(
            db,
            "posts",
            postId
          ),
          {
            likes: increment(-1)
          }
        );

      } else {

        await setDoc(
          likeRef,
          {
            userId: user.uid
          }
        );

        await updateDoc(
          doc(
            db,
            "posts",
            postId
          ),
          {
            likes: increment(1)
          }
        );

      }

      location.reload();

    } catch (error) {

      console.error(
        "Like error:",
        error
      );

    }

  }
);
