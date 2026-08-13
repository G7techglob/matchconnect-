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


console.log("✅ Create Post JS is working");


// =====================================================
// INITIALIZE CREATE POST
// =====================================================

function initializeCreatePost() {

    console.log("🔄 Initializing Create Post...");


    const createPostBtn =
        document.getElementById("createPostBtn");

    const mediaPostInput =
        document.getElementById("mediaPostInput");

    const postBtn =
    document.getElementById("postBtn");

const postContent =
    document.getElementById("postContent");

    // =====================================================
    // CHECK ELEMENTS
    // =====================================================

    console.log("Create Post elements:", {
        createPostBtn,
        mediaPostInput,
        profilePostBtn,
        profilePostContent
    });


    if (
    !createPostBtn ||
    !mediaPostInput ||
    !postBtn ||
    !postContent
)
    {

        console.error(
            "❌ Create Post elements not found."
        );

        return;
    }


    console.log(
        "✅ All Create Post elements connected."
    );


    // =====================================================
    // PHOTO / VIDEO BUTTON
    // =====================================================

    createPostBtn.addEventListener("click", () => {

        console.log("📷 Photo/Video button clicked");

        mediaPostInput.click();

    });


    // =====================================================
    // POST BUTTON
    // =====================================================

    postBtn.addEventListener(
    "click",
    async () => {

            console.log("📝 Post button clicked");


            // =====================================================
            // CHECK USER
            // =====================================================

            const user = auth.currentUser;


            console.log("Current user:", user);


            if (!user) {

                alert("Please log in first.");

                return;
            }


            // =====================================================
            // GET TEXT
            // =====================================================

        const text =
    postContent.value.trim();

            // =====================================================
            // GET FILES
            // =====================================================

            const files =
                Array.from(
                    mediaPostInput.files || []
                );


            console.log("Post text:", text);

            console.log("Selected files:", files);


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

                // =====================================================
                // DISABLE POST BUTTON
                // =====================================================

                postBtn.disabled = true;

postBtn.textContent =
    "Posting...";


                // =====================================================
                // UPLOAD MEDIA
                // =====================================================

                const media = [];


                for (const file of files) {

                    console.log(
                        "Uploading:",
                        file.name
                    );


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


                    console.log(
                        "✅ File uploaded:",
                        downloadURL
                    );

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

                console.log(
                    "Saving post to Firestore..."
                );


                const postRef = await addDoc(
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


                console.log(
                    "✅ Post saved:",
                    postRef.id
                );


                // =====================================================
                // CLEAR FORM
                // =====================================================

                postContent.value = "";

mediaPostInput.value = "";

                // =====================================================
                // SUCCESS
                // =====================================================

                alert(
                    "Post published successfully!"
                );

            } catch (error) {

                console.error(
                    "❌ Create post error:",
                    error
                );


                alert(
                    "Failed to create post: " +
                    error.message
                );


            } finally {

                postBtn.disabled = false;

postBtn.textContent =
    "Post";
            }

        }
    );

}


// =====================================================
// START CREATE POST
// =====================================================

if (document.getElementById("createPostBtn")) {

    initializeCreatePost();

} else {

    console.error(
        "Create Post HTML is not ready yet."
    );

}
