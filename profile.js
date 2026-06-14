import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  deleteDoc,
  setDoc
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

console.log("PROFILE PAGE STARTED");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found");
      return;
    }

    const data =
      userSnap.data();

    document.getElementById(
      "profileName"
    ).textContent =
      data.name || "No Name";

    document.getElementById(
      "profileEmail"
    ).textContent =
      data.email || user.email;

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

    await loadMyPosts();

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

});

const saveBtn =
  document.getElementById(
    "saveProfileBtn"
  );

if (saveBtn) {

  saveBtn.addEventListener(
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
          "Profile updated successfully!"
        );

        location.reload();

      } catch (error) {

        console.error(error);
        alert(error.message);

      }

    }
  );

}

const profilePostBtn =
  document.getElementById("profilePostBtn");

if (profilePostBtn) {

  profilePostBtn.addEventListener(
    "click",
    async () => {

      const user =
        auth.currentUser;

      if (!user) {
        alert("Please login");
        return;
      }

      const content =
        document.getElementById(
          "profilePostContent"
        ).value.trim();

      if (!content) {
        alert("Write something first");
        return;
      }

      try {

        const userSnap =
          await getDoc(
            doc(
              db,
              "users",
              user.uid
            )
          );

        const profileData =
          userSnap.data();

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
            createdAt:
              serverTimestamp()
          }
        );

        alert("Post created!");

        document.getElementById(
          "profilePostContent"
        ).value = "";

      } catch (error) {

        console.error(error);
        alert(error.message);

      }

    }
  );

}


async function loadMyPosts() {

  console.log("LOAD POSTS STARTED");
alert("LOAD POSTS STARTED");

  const myPosts =
    document.getElementById("myPosts");

  if (!myPosts) return;

  myPosts.innerHTML = "";

  const postsSnapshot =
    await getDocs(
      collection(db, "posts")
    );

  postsSnapshot.forEach((postDoc) => {

    const post = postDoc.data();

    const div =
      document.createElement("div");

    div.innerHTML = `

<div class="post-header">

  <img
    src="${post.photoURL || 'images/default-avatar.png'}"
    class="post-avatar"
    width="40"
  >

  <strong>
    ${post.username || "User"}
  </strong>

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

  <button
    class="delete-btn"
    data-id="${postDoc.id}">
    🗑 Delete
  </button>

</div>

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

    myPosts.appendChild(div);

  });

}


document.addEventListener(
  "click",
  async (e) => {

    if (
      !e.target.classList.contains(
        "delete-btn"
      )
    ) return;

    const postId =
      e.target.dataset.id;

    const confirmed =
      confirm(
        "Delete this post?"
      );

    if (!confirmed) return;

    try {

      await deleteDoc(
        doc(
          db,
          "posts",
          postId
        )
      );

      alert(
        "Post deleted"
      );

      loadMyPosts();

    } catch (error) {

      console.error(error);
      alert(error.message);

    }

  }
);

alert("PROFILE JS FINISHED LOADING");
