import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// =====================================================
// GET POST ID FROM URL
// =====================================================

const params = new URLSearchParams(
  window.location.search
);

const postId = params.get("id");

console.log("Post ID from URL:", postId);


// =====================================================
// MAIN CONTAINER
// =====================================================

const container =
  document.getElementById("postContainer");


// =====================================================
// CHECK POST ID
// =====================================================

if (!postId) {

  container.innerHTML = `
    <p style="text-align:center;color:#999;">
      Post not found.
    </p>
  `;

} else {

  loadPost();

}


// =====================================================
// LOAD POST
// =====================================================

async function loadPost() {

  try {

    const postRef = doc(
      db,
      "posts",
      postId
    );

    const postSnap = await getDoc(postRef);

    console.log(
      "POST EXISTS:",
      postSnap.exists()
    );


    if (!postSnap.exists()) {

      container.innerHTML = `
        <p style="text-align:center;color:#999;">
          Post not found.
        </p>
      `;

      return;
    }


    const post = postSnap.data();

    let username =
      post.username || "User";

    let photoURL =
      post.photoURL ||
      "images/default-avatar.png";


    // =================================================
    // LOAD CURRENT PROFILE DATA
    // =================================================

    if (post.userId) {

      try {

        const userSnap = await getDoc(
          doc(
            db,
            "users",
            post.userId
          )
        );

        if (userSnap.exists()) {

          const userData =
            userSnap.data();

          username =
            userData.name ||
            username;

          photoURL =
            userData.photoURL ||
            photoURL;

        }

      } catch (error) {

        console.log(
          "Could not load user profile:",
          error
        );

      }

    }


    // =================================================
    // DISPLAY POST
    // =================================================

    container.innerHTML = `

      <div class="post-header">

  <div class="post-user-info">

    <img
      src="${escapeHTML(photoURL)}"
      class="post-avatar view-profile"
      data-uid="${post.userId || ""}"
      alt="${escapeHTML(username)}"
    >

    <div>

      <h3
        class="post-user view-profile"
        data-uid="${post.userId || ""}"
      >
        ${escapeHTML(username)}
      </h3>

    </div>

  </div>

  <button
    class="post-options-btn"
    data-id="${postId}"
    type="button"
    aria-label="Post options"
  >
    <i class="fa-solid fa-ellipsis-vertical"></i>
  </button>

</div>


      <div class="post-content">

        <p>
          ${escapeHTML(post.content || "")}
        </p>

      </div>


      <div class="post-actions">

        <button
          class="action-btn like-btn"
          data-id="${postId}"
        >
          ❤️ ${post.likes || 0} Likes
        </button>


        <button
          class="action-btn comment-btn"
          data-id="${postId}"
        >
          💬 ${post.comments || 0} Comments
        </button>


        <button
          class="action-btn share-btn"
          data-id="${postId}"
        >
          🔄 Share
        </button>

        ${
          auth.currentUser &&
          auth.currentUser.uid === post.userId
          ?
          `
          <button
            class="action-btn delete-btn"
            data-id="${postId}"
          >
            🗑 Delete
          </button>
          `
          :
          ""
        }

      </div>


      <h3 class="comments-title">
        Comments
      </h3>


      <div id="commentsList">
        <p style="color:#999;">
          Loading comments...
        </p>
      </div>

    `;


    // =================================================
    // LOAD COMMENTS
    // =================================================

    await loadComments(postId);


  } catch (error) {

    console.error(
      "Load post error:",
      error
    );

    container.innerHTML = `
      <p style="text-align:center;color:#999;">
        Unable to load this post.
      </p>
    `;

  }

}


// =====================================================
// LOAD COMMENTS
// =====================================================

async function loadComments(postId) {

  const commentsList =
    document.getElementById(
      "commentsList"
    );

  try {

    const commentsSnapshot =
      await getDocs(
        collection(
          db,
          "posts",
          postId,
          "comments"
        )
      );


    commentsList.innerHTML = "";


    if (commentsSnapshot.empty) {

      commentsList.innerHTML = `
        <p style="color:#999;font-style:italic;">
          No comments yet. Be the first to comment!
        </p>
      `;

      return;
    }


    commentsSnapshot.forEach(
      (commentDoc) => {

        const comment =
          commentDoc.data();

        const commentDiv =
          document.createElement("div");

        commentDiv.className =
          "comment-item";


        commentDiv.innerHTML = `

          <strong>
            ${escapeHTML(
              comment.username ||
              "Anonymous"
            )}
          </strong>

          <p>
            ${escapeHTML(
              comment.text || ""
            )}
          </p>

        `;


        commentsList.appendChild(
          commentDiv
        );

      }
    );


  } catch (error) {

    console.error(
      "Comments error:",
      error
    );

    commentsList.innerHTML = `
      <p style="color:#999;">
        Unable to load comments.
      </p>
    `;

  }

}


// =====================================================
// LIKE POST
// =====================================================

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

      alert(
        "Please login first"
      );

      return;
    }


    const postId =
      e.target.dataset.id;


    try {

      const likeRef =
        doc(
          db,
          "posts",
          postId,
          "likes",
          user.uid
        );


      const likeSnap =
        await getDoc(
          likeRef
        );


      if (likeSnap.exists()) {

        alert(
          "You already liked this post."
        );

        return;

      }


      await import(
        "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
      );


      await updateDoc(
        doc(
          db,
          "posts",
          postId
        ),
        {
          likes:
            increment(1)
        }
      );


      // Reload page data
      await loadPost();


    } catch (error) {

      console.error(
        "Like error:",
        error
      );

    }

  }
);


// =====================================================
// COMMENT BUTTON
// =====================================================

document.addEventListener(
  "click",
  (e) => {

    if (
      !e.target.classList.contains(
        "comment-btn"
      )
    ) return;


    const postId =
      e.target.dataset.id;


    window.location.href =
      `comments.html?postId=${encodeURIComponent(
        postId
      )}`;

  }
);


// =====================================================
// SHARE POST
// =====================================================

document.addEventListener(
  "click",
  (e) => {

    if (
      !e.target.classList.contains(
        "share-btn"
      )
    ) return;


    const postId =
      e.target.dataset.id;


    if (!postId) {

      console.error(
        "No post ID found."
      );

      return;
    }


    window.location.href =
      `share-post.html?id=${encodeURIComponent(
        postId
      )}`;

  }
);


// =====================================================
// DELETE POST
// =====================================================

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
        "Are you sure you want to delete this post?"
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
        "Post deleted successfully."
      );


      window.location.href =
        "index.html";


    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      alert(
        "Unable to delete post."
      );

    }

  }
);


// =====================================================
// VIEW PROFILE
// =====================================================

document.addEventListener(
  "click",
  (e) => {

    if (
      !e.target.classList.contains(
        "view-profile"
      )
    ) return;


    const uid =
      e.target.dataset.uid;


    if (!uid) return;


    window.location.href =
      `user.html?uid=${encodeURIComponent(
        uid
      )}`;

  }
);


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(str) {

  return String(str)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

      }
