import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// GET POST ID
// =====================================================

const params = new URLSearchParams(window.location.search);
const postId = params.get("id");


// =====================================================
// ELEMENTS
// =====================================================

const postInfo = document.getElementById("postInfo");
const optionsList = document.getElementById("optionsList");
const closeBtn = document.getElementById("closeBtn");


// =====================================================
// CHECK ELEMENTS
// =====================================================

if (!postInfo || !optionsList || !closeBtn) {

  console.error("Post options HTML elements are missing.");

} else if (!postId) {

  postInfo.innerHTML = `
    <p>Post not found.</p>
  `;

} else {

  checkUser();

}


// =====================================================
// CHECK LOGIN
// =====================================================

function checkUser() {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {

      window.location.href = "login.html";
      return;

    }

    await loadPost(user);

  });

}


// =====================================================
// LOAD POST
// =====================================================

async function loadPost(user) {

  try {

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {

      postInfo.innerHTML = `
        <p>Post not found.</p>
      `;

      optionsList.innerHTML = "";
      return;

    }

    const post = postSnap.data();

    const postText = post.content || "This post";

    const ownerId = post.userId;

    const isOwner = ownerId === user.uid;


    // =================================================
    // SHOW POST INFORMATION
    // =================================================

    postInfo.innerHTML = `
      <p>
        <strong>
          ${escapeHTML(postText.substring(0, 100))}
        </strong>
      </p>
    `;


    // =================================================
    // BUILD OPTIONS
    // =================================================

    optionsList.innerHTML = "";


    // =================================================
    // OWNER OPTIONS
    // =================================================

    if (isOwner) {

      optionsList.innerHTML = `

        <button
          class="option-btn"
          id="editPostBtn"
          type="button">

          <span class="option-icon">✏️</span>
          <span>Edit Post</span>

        </button>


        <button
          class="option-btn option-danger"
          id="deletePostBtn"
          type="button">

          <span class="option-icon">🗑️</span>
          <span>Delete Post</span>

        </button>


        <button
          class="option-btn"
          id="copyTextBtn"
          type="button">

          <span class="option-icon">📄</span>
          <span>Copy Post Text</span>

        </button>


        <button
          class="option-btn"
          id="savePostBtn"
          type="button">

          <span class="option-icon">💾</span>
          <span>Save Post</span>

        </button>


        <button
          class="option-btn"
          id="favoriteBtn"
          type="button">

          <span class="option-icon">⭐</span>
          <span>Add to Favorites</span>

        </button>


        <button
          class="option-btn"
          id="downloadBtn"
          type="button">

          <span class="option-icon">⬇️</span>
          <span>Download Image</span>

        </button>

      `;

    }


    // =================================================
    // OTHER USER OPTIONS
    // =================================================

    else {

      optionsList.innerHTML = `

        <button
          class="option-btn"
          id="copyTextBtn"
          type="button">

          <span class="option-icon">📄</span>
          <span>Copy Post Text</span>

        </button>


        <button
          class="option-btn"
          id="savePostBtn"
          type="button">

          <span class="option-icon">💾</span>
          <span>Save Post</span>

        </button>


        <button
          class="option-btn"
          id="favoriteBtn"
          type="button">

          <span class="option-icon">⭐</span>
          <span>Add to Favorites</span>

        </button>


        <button
          class="option-btn"
          id="downloadBtn"
          type="button">

          <span class="option-icon">⬇️</span>
          <span>Download Image</span>

        </button>


        <button
          class="option-btn"
          id="hidePostBtn"
          type="button">

          <span class="option-icon">🙈</span>
          <span>Hide Post</span>

        </button>


        <button
          class="option-btn option-danger"
          id="reportPostBtn"
          type="button">

          <span class="option-icon">🚩</span>
          <span>Report Post</span>

        </button>

      `;

    }


    // =================================================
    // CONNECT BUTTONS
    // =================================================

    setupButtons(user, post);

  } catch (error) {

    console.error("Post options error:", error);

    postInfo.innerHTML = `
      <p>Unable to load post options.</p>
    `;

    optionsList.innerHTML = `
      <p>Something went wrong while loading the options.</p>
    `;

  }

}


// =====================================================
// SETUP BUTTONS
// =====================================================

function setupButtons(user, post) {


  // ===================================================
  // EDIT POST
  // ===================================================

  const editBtn = document.getElementById("editPostBtn");

  if (editBtn) {

    editBtn.addEventListener("click", () => {

      window.location.href =
        `edit-post.html?id=${encodeURIComponent(postId)}`;

    });

  }


  // ===================================================
  // DELETE POST
  // ===================================================

  const deleteBtn = document.getElementById("deletePostBtn");

  if (deleteBtn) {

    deleteBtn.addEventListener("click", async () => {

      const confirmed = confirm(
        "Are you sure you want to delete this post?"
      );

      if (!confirmed) return;

      try {

        deleteBtn.disabled = true;

        deleteBtn.innerHTML = `
          <span class="option-icon">⏳</span>
          <span>Deleting...</span>
        `;

        await deleteDoc(
          doc(db, "posts", postId)
        );

        alert("Post deleted successfully.");

        window.location.href = "index.html";

      } catch (error) {

        console.error("Delete post error:", error);

        deleteBtn.disabled = false;

        deleteBtn.innerHTML = `
          <span class="option-icon">🗑️</span>
          <span>Delete Post</span>
        `;

        alert("Unable to delete post.");

      }

    });

  }


  // ===================================================
  // COPY POST TEXT
  // ===================================================

  const copyTextBtn = document.getElementById("copyTextBtn");

  if (copyTextBtn) {

    copyTextBtn.addEventListener("click", async () => {

      const text = post.content || "";

      if (!text) {

        alert("This post has no text to copy.");
        return;

      }

      try {

        await navigator.clipboard.writeText(text);

        alert("Post text copied.");

      } catch (error) {

        console.error("Copy text error:", error);

        alert("Unable to copy post text.");

      }

    });

  }


  // ===================================================
  // SAVE POST
  // ===================================================

  const savePostBtn = document.getElementById("savePostBtn");

  if (savePostBtn) {

    savePostBtn.addEventListener("click", async () => {

      try {

        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "savedPosts",
            postId
          ),
          {
            postId: postId,
            savedAt: serverTimestamp()
          }
        );

        savePostBtn.innerHTML = `
          <span class="option-icon">✅</span>
          <span>Post Saved</span>
        `;

      } catch (error) {

        console.error("Save post error:", error);

        alert("Unable to save post.");

      }

    });

  }


  // ===================================================
  // ADD TO FAVORITES
  // ===================================================

  const favoriteBtn = document.getElementById("favoriteBtn");

  if (favoriteBtn) {

    favoriteBtn.addEventListener("click", async () => {

      try {

        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "favorites",
            postId
          ),
          {
            postId: postId,
            addedAt: serverTimestamp()
          }
        );

        favoriteBtn.innerHTML = `
          <span class="option-icon">✅</span>
          <span>Added to Favorites</span>
        `;

      } catch (error) {

        console.error("Favorite error:", error);

        alert("Unable to add to favorites.");

      }

    });

  }


  // ===================================================
  // DOWNLOAD IMAGE
  // ===================================================

  const downloadBtn = document.getElementById("downloadBtn");

  if (downloadBtn) {

    downloadBtn.addEventListener("click", () => {

      if (!post.imageURL) {

        alert("This post does not contain an image.");

        return;

      }

      const link = document.createElement("a");

      link.href = post.imageURL;
      link.download = "matchconnect-post";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

    });

  }


  // ===================================================
  // HIDE POST
  // ===================================================

  const hidePostBtn = document.getElementById("hidePostBtn");

  if (hidePostBtn) {

    hidePostBtn.addEventListener("click", async () => {

      try {

        await setDoc(
          doc(
            db,
            "users",
            user.uid,
            "hiddenPosts",
            postId
          ),
          {
            postId: postId,
            hiddenAt: serverTimestamp()
          }
        );

        alert("Post hidden.");

        window.location.href = "index.html";

      } catch (error) {

        console.error("Hide post error:", error);

        alert("Unable to hide post.");

      }

    });

  }


  // ===================================================
  // REPORT POST
  // ===================================================

  const reportPostBtn = document.getElementById("reportPostBtn");

  if (reportPostBtn) {

    reportPostBtn.addEventListener("click", async () => {

      const reason = prompt(
        "Why are you reporting this post?"
      );

      if (!reason) return;

      try {

        await setDoc(
          doc(
            db,
            "reports",
            `${postId}_${user.uid}`
          ),
          {
            postId: postId,
            reportedBy: user.uid,
            postOwner: post.userId,
            reason: reason,
            createdAt: serverTimestamp()
          }
        );

        alert("Thank you. Your report has been submitted.");

        reportPostBtn.innerHTML = `
          <span class="option-icon">✅</span>
          <span>Report Submitted</span>
        `;

      } catch (error) {

        console.error("Report error:", error);

        alert("Unable to submit report.");

      }

    });

  }

}


// =====================================================
// CLOSE BUTTON
// =====================================================

closeBtn.addEventListener("click", () => {

  window.history.back();

});


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(str) {

  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
