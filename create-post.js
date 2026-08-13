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


// =====================================================
// LOAD CREATE POST HTML
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    const container =
        document.getElementById("create-post-container");

    if (!container) {
        console.error("create-post-container not found");
        return;
    }

    try {

        const response =
            await fetch("create-post.html");

        if (!response.ok) {
            throw new Error("Failed to load create-post.html");
        }

        const html =
            await response.text();

        container.innerHTML = html;


        // =====================================================
        // LOAD CREATE POST CSS
        // =====================================================

        if (!document.querySelector('link[href="create-post.css"]')) {

            const css =
                document.createElement("link");

            css.rel = "stylesheet";
            css.href = "create-post.css";

            document.head.appendChild(css);
        }


        console.log("Create Post HTML loaded");


        // =====================================================
        // START CREATE POST FUNCTION
        // =====================================================

        initializeCreatePost();

    } catch (error) {

        console.error(
            "Error loading Create Post:",
            error
        );

    }

});


// =====================================================
// CREATE POST FUNCTION
// =====================================================

function initializeCreatePost() {

    const createPostBtn =
        document.getElementById("createPostBtn");

    const mediaPostInput =
        document.getElementById("mediaPostInput");

    const profilePostBtn =
        document.getElementById("profilePostBtn");

    const profilePostContent =
        document.getElementById("profilePostContent");


    // =====================================================
    // CHECK ELEMENTS
    // =====================================================

    if (
        !createPostBtn ||
        !mediaPostInput ||
        !profilePostBtn ||
        !profilePostContent
    ) {

        console.error(
            "Create Post elements not found"
        );

        return;
    }


    console.log(
        "All Create Post elements connected"
    );


    // =====================================================
    // PHOTO / VIDEO BUTTON
    // =====================================================

    createPostBtn.addEventListener("click", () => {

        mediaPostInput.click();

    });


    // =====================================================
    // POST BUTTON
    // =====================================================

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


            // =====================================================
            // CHECK EMPTY POST
            // =====================================================

            if (!text && files.length === 0) {

                alert(
                    "Please write something or select a photo/video."
                );

                return;
            }


            try {

                profilePostBtn.disabled = true;

                profilePostBtn.textContent =
                    "Posting...";


                // =====================================================
                // UPLOAD MEDIA
                // =====================================================

                const media = [];


                for (const file of files) {

                    const filePath =
                        `posts/${user.uid}/${Date.now()}_${file.name}`;


                    const storageRef =
                        ref(storage, filePath);


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
                            file.type.startsWith("video/")
                                ? "video"
                                : "image"

                    });

                }


                // =====================================================
                // USER INFORMATION
                // =====================================================

                const username =
                    user.displayName ||
                    user.email?.split("@")[0] ||
                    "User";


                const photoURL =
                    user.photoURL || "";


                // =====================================================
                // SAVE POST
                // =====================================================

                await addDoc(
                    collection(db, "posts"),
                    {

                        userId: user.uid,

                        username: username,

                        photoURL: photoURL,

                        content: text,

                        media: media,

                        likes: 0,

                        comments: 0,

                        createdAt:
                            serverTimestamp()

                    }
                );


                // =====================================================
                // CLEAR FORM
                // =====================================================

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
