import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// GET POST ID
// =====================================================

const params =
  new URLSearchParams(window.location.search);

const postId =
  params.get("id");


// =====================================================
// ELEMENTS
// =====================================================

const postInfo =
  document.getElementById("postInfo");

const optionsList =
  document.getElementById("optionsList");

const closeBtn =
  document.getElementById("closeBtn");


// =====================================================
// CHECK POST ID
// =====================================================

if (!postId) {

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

  onAuthStateChanged(
    auth,
    async (user) => {

      if (!user) {

        window.location.href =
          "login.html";

        return;
      }


      await loadPost(user);

    }
  );

}


// =====================================================
// LOAD POST
// =====================================================

async function loadPost(user) {

  try {

    const postRef =
      doc(
        db,
        "posts",
        postId
      );


    const postSnap =
      await getDoc(postRef);


    if (!postSnap.exists()) {

      postInfo.innerHTML = `
        <p>Post not found.</p>
      `;

      return;
    }


    const post =
      postSnap.data();


    const ownerId =
      post.userId;


    // =================================================
    // SHOW POST INFORMATION
    // =================================================

    const postText =
      post.content || "This post";


    postInfo.innerHTML = `
      <p>
        <strong>
          ${escapeHTML(
            postText.substring(0, 100)
          )}
        </strong>
      </p>
    `;


    // =================================================
    // CHECK OWNERSHIP
    // =================================================

    const isOwner =
      ownerId === user.uid;


    // =================================================
    // CLEAR OPTIONS
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
          type="button"
        >

          <span class="option-icon">
            ✏️
          </span>

          <span>
            Edit Post
          </span>

        </button>


        <button
          class="option-btn option-danger"
          id="deletePostBtn"
          type="button"
        >

          <span class="option-icon">
            🗑️
          </span>

          <span>
            Delete Post
          </span>

        </button>

      `;


      setupOwnerButtons();

    }


    // =================================================
    // OTHER USER OPTIONS
    // =================================================

    else {

      optionsList.innerHTML = `

        <button
          class="option-btn"
          id="copyLinkBtn"
          type="button"
        >

          <span class="option-icon">
            🔗
          </span>

          <span>
            Copy Post Link
          </span>

        </button>


        <button
          class="option-btn option-danger"
          id="reportPostBtn"
          type="button"
        >

          <span class="option-icon">
            🚩
          </span>

          <span>
            Report Post
          </span>

        </button>

      `;


      setupOtherButtons();

    }


  } catch (error) {

    console.error(
      "Post options error:",
      error
    );

    postInfo.innerHTML = `
      <p>
        Unable to load post options.
      </p>
    `;

  }

}


// =====================================================
// OWNER BUTTONS
// =====================================================

function setupOwnerButtons() {

  const editBtn =
    document.getElementById(
      "editPostBtn"
    );


  const deleteBtn =
    document.getElementById(
      "deletePostBtn"
    );


  // ===================================================
  // EDIT
  // ===================================================

  if (editBtn) {

    editBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          `edit-post.html?id=${encodeURIComponent(
            postId
          )}`;

      }
    );

  }


  // ===================================================
  // DELETE
  // ===================================================

  if (deleteBtn) {

    deleteBtn.addEventListener(
      "click",
      async () => {

        const confirmDelete =
          confirm(
            "Are you sure you want to delete this post?"
          );


        if (!confirmDelete) {

          return;

        }


        try {

          deleteBtn.disabled = true;

          deleteBtn.innerHTML = `
            <span class="option-icon">
              ⏳
            </span>

            <span>
              Deleting...
            </span>
          `;


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
            "Delete post error:",
            error
          );


          deleteBtn.disabled = false;


          deleteBtn.innerHTML = `
            <span class="option-icon">
              🗑️
            </span>

            <span>
              Delete Post
            </span>
          `;


          alert(
            "Unable to delete post."
          );

        }

      }
    );

  }

}


// =====================================================
// OTHER USER BUTTONS
// =====================================================

function setupOtherButtons() {

  const copyBtn =
    document.getElementById(
      "copyLinkBtn"
    );


  const reportBtn =
    document.getElementById(
      "reportPostBtn"
    );


  // ===================================================
  // COPY LINK
  // ===================================================

  if (copyBtn) {

    copyBtn.addEventListener(
      "click",
      async () => {

        try {

          await navigator.clipboard.writeText(
            window.location.origin +
            window.location.pathname
              .replace(
                "post-options.html",
                "post.html"
              ) +
            "?id=" +
            encodeURIComponent(postId)
          );


          alert(
            "Post link copied."
          );


        } catch (error) {

          console.error(
            "Copy link error:",
            error
          );

        }

      }
    );

  }


  // ===================================================
  // REPORT
  // ===================================================

  if (reportBtn) {

    reportBtn.addEventListener(
      "click",
      () => {

        alert(
          "Report feature will be added next."
        );

      }
    );

  }

}


// =====================================================
// CLOSE BUTTON
// =====================================================

closeBtn.addEventListener(
  "click",
  () => {

    window.history.back();

  }
);


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
