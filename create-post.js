import { auth, db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";


console.log("Create Post JS is working");


// ======================================
// LOAD CREATE POST HTML
// ======================================

const createPostContainer =
    document.getElementById("create-post-container");

if (!createPostContainer) {

    console.log(
        "create-post-container not found on this page."
    );

} else {

    fetch("create-post.html")
        .then(response => {

            if (!response.ok) {
                throw new Error(
                    "Failed to load create-post.html"
                );
            }

            return response.text();

        })

        .then(html => {

            // Insert Create Post HTML
            createPostContainer.innerHTML = html;


            // ======================================
            // LOAD CREATE POST CSS
            // ======================================

            if (
                !document.querySelector(
                    'link[href="create-post.css"]'
                )
            ) {

                const style =
                    document.createElement("link");

                style.rel = "stylesheet";
                style.href = "create-post.css";

                document.head.appendChild(style);
            }


            // ======================================
            // INITIALIZE CREATE POST
            // ======================================

            initializeCreatePost();

        })

        .catch(error => {

            console.error(
                "Create Post loading error:",
                error
            );

        });
}


// ======================================
// CREATE POST FUNCTION
// ======================================

function initializeCreatePost() {

    // ======================================
    // UI ELEMENTS
    // ======================================

    const createPostBtn =
        document.getElementById("createPostBtn");

    const mediaPostInput =
        document.getElementById("mediaPostInput");

    const profilePostBtn =
        document.getElementById("profilePostBtn");

    const profilePostContent =
        document.getElementById("profilePostContent");


    // ======================================
    // CHECK ELEMENTS
    // ======================================

    if (!createPostBtn) {

        console.error(
            "createPostBtn not found."
        );

        return;
    }

    if (!mediaPostInput) {

        console.error(
            "mediaPostInput not found."
        );

        return;
    }

    if (!profilePostBtn) {

        console.error(
            "profilePostBtn not found."
        );

        return;
    }

    if (!profilePostContent) {

        console.error(
            "profilePostContent not found."
        );

        return;
    }


    // ======================================
    // OPEN PHOTO / VIDEO SELECTOR
    // ======================================

    createPostBtn.addEventListener(
        "click",
        () => {

            mediaPostInput.click();

        }
    );


    // ======================================
    // CREATE POST
    // ======================================

    profilePostBtn.addEventListener(
        "click",
        async () => {

            const user = auth.currentUser;

            if (!user) {

                alert("Please log in first.");

                return;
            }


            const text =
                profilePostContent.value.trim();

            const files =
                Array.from(
                    mediaPostInput.files || []
                );


            if (
                !text &&
                files.length === 0
            ) {

                alert(
                    "Please write something or select a photo/video."
                );

                return;
            }


            try {

                // Prevent double clicks
                profilePostBtn.disabled = true;

                profilePostBtn.textContent =
                    "Posting...";


                // ======================================
                // UPLOAD MEDIA
                // ======================================

                const media = [];


                for (const file of files) {

                    const filePath =
                        `posts/${user.uid}/${Date.now()}_${file.name}`;

                    const storageRef =
                        ref(
                            storage,
                            filePath
                        );


                    await uploadBytes(
                        storageRef,
                        file
                    );


                    const downloadURL =
                        await getDownloadURL(
                            storageRef
                        );


                    media.push({

                        url: downloadURL,

                        type:
                            file.type.startsWith(
                                "video/"
                            )
                                ? "video"
                                : "image"

                    });

                }


                // ======================================
                // GET USER INFORMATION
                // ======================================

                const username =
                    user.displayName ||
                    user.email?.split("@")[0] ||
                    "User";


                const photoURL =
                    user.photoURL || "";


                // ======================================
                // SAVE POST
                // ======================================

                await addDoc(
                    collection(
                        db,
                        "posts"
                    ),
                    {

                        userId:
                            user.uid,

                        username:
                            username,

                        photoURL:
                            photoURL,

                        content:
                            text,

                        media:
                            media,

                        likes:
                            0,

                        comments:
                            0,

                        createdAt:
                            serverTimestamp()

                    }
                );


                // ======================================
                // CLEAR FORM
                // ======================================

                profilePostContent.value = "";

                mediaPostInput.value = "";


                alert(
                    "Post published successfully!"
                );


            } catch (error) {

                console.error(
                    "Create post error:",
                    error
                );


                alert(
                    "Failed to create post: " +
                    error.message
                );


            } finally {

                profilePostBtn.disabled = false;

                profilePostBtn.textContent =
                    "Post";

            }

        }
    );

        }
