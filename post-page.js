import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
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

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

const params =
  new URLSearchParams(
    window.location.search
  );

const postId =
  params.get("id");

document.getElementById(
  "postContainer"
).innerHTML =
  "POST ID: " + postId;

if (postId) {

  const postDoc =
    await getDoc(
      doc(
        db,
        "posts",
        postId
      )
    );
  console.log(
  "POST EXISTS:",
  postDoc.exists()
);

  if (postDoc.exists()) {

    const post =
      postDoc.data();

    const container =
      document.getElementById(
        "postContainer"
      );

    container.innerHTML = `

<div class="post-header">

  <img
    src="${post.photoURL || 'images/default-avatar.png'}"
    class="post-avatar"
  >

  <div>

    <h3>
      ${post.username || "User"}
    </h3>

  </div>

</div>

<p>
  ${post.content}
</p>

<div class="post-actions">

  ❤️ ${post.likes || 0}

  <br><br>

  💬 ${post.comments || 0}

</div>

<h3>Comments</h3>

<div id="commentsList">
</div>

`;

    const commentsList =
      document.getElementById(
        "commentsList"
      );

    const commentsSnapshot =
      await getDocs(
        collection(
          db,
          "posts",
          postId,
          "comments"
        )
      );

    commentsSnapshot.forEach(
      (commentDoc) => {

        const comment =
          commentDoc.data();

        const p =
          document.createElement("p");

        p.textContent =
          comment.username +
          ": " +
          comment.text;

        commentsList.appendChild(
          p
        );

      }
    );

  }
  else {

  document.getElementById(
    "postContainer"
  ).innerHTML =
    "Post not found";

}

          }
