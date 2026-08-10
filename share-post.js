/* =====================================================
   MATCHCONNECT - SHARE POST
   File: share-post.js
===================================================== */

import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =====================================================
   GET ELEMENTS
===================================================== */

const overlay = document.getElementById("overlay");
const shareSheet = document.getElementById("shareSheet");

const whatsappBtn = document.getElementById("whatsappBtn");
const facebookBtn = document.getElementById("facebookBtn");
const telegramBtn = document.getElementById("telegramBtn");
const messengerBtn = document.getElementById("messengerBtn");
const emailBtn = document.getElementById("emailBtn");

const groupBtn = document.getElementById("groupBtn");
const chatBtn = document.getElementById("chatBtn");
const repostBtn = document.getElementById("repostBtn");

const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyTextBtn = document.getElementById("copyTextBtn");

const saveBtn = document.getElementById("saveBtn");
const pinBtn = document.getElementById("pinBtn");
const favoriteBtn = document.getElementById("favoriteBtn");

const downloadBtn = document.getElementById("downloadBtn");
const hideBtn = document.getElementById("hideBtn");
const reportBtn = document.getElementById("reportBtn");

const cancelBtn = document.getElementById("cancelBtn");


/* =====================================================
   GET POST ID FROM URL
===================================================== */

const params = new URLSearchParams(window.location.search);

const postId = params.get("id");


/* =====================================================
   POST DATA
===================================================== */

let postData = null;


/* =====================================================
   LOAD POST
===================================================== */

async function loadPost() {

    if (!postId) {
        console.error("No post ID found.");
        showMessage("Post not found.");
        return;
    }

    try {

        const postRef = doc(db, "posts", postId);

        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            console.error("Post does not exist.");
            showMessage("This post no longer exists.");
            return;
        }

        postData = {
            id: postSnap.id,
            ...postSnap.data()
        };

        console.log("Post loaded:", postData);

        updateButtonStates();

    } catch (error) {

        console.error("Error loading post:", error);

        showMessage("Unable to load this post.");

    }
}


/* =====================================================
   POST URL
===================================================== */

function getPostUrl() {

    return `${window.location.origin}/matchconnect-/post.html?id=${postId}`;

}


/* =====================================================
   POST TEXT
===================================================== */

function getPostText() {

    if (!postData) {
        return "";
    }

    return postData.content || postData.text || "";

}


/* =====================================================
   SHARE TEXT
===================================================== */

function getShareText() {

    const text = getPostText();

    const url = getPostUrl();

    return text
        ? `${text}\n\n${url}`
        : url;

}


/* =====================================================
   WHATSAPP
===================================================== */

whatsappBtn.addEventListener("click", () => {

    const text = encodeURIComponent(getShareText());

    const url = `https://wa.me/?text=${text}`;

    window.open(url, "_blank");

});


/* =====================================================
   FACEBOOK
===================================================== */

facebookBtn.addEventListener("click", () => {

    const url = encodeURIComponent(getPostUrl());

    const shareUrl =
        `https://www.facebook.com/sharer/sharer.php?u=${url}`;

    window.open(
        shareUrl,
        "_blank",
        "width=600,height=500"
    );

});


/* =====================================================
   TELEGRAM
===================================================== */

telegramBtn.addEventListener("click", () => {

    const url = encodeURIComponent(getPostUrl());

    const text = encodeURIComponent(getPostText());

    const shareUrl =
        `https://t.me/share/url?url=${url}&text=${text}`;

    window.open(shareUrl, "_blank");

});


/* =====================================================
   MESSENGER
===================================================== */

messengerBtn.addEventListener("click", () => {

    const url = encodeURIComponent(getPostUrl());

    const shareUrl =
        `https://www.facebook.com/dialog/send?link=${url}&app_id=YOUR_FACEBOOK_APP_ID`;

    window.open(
        shareUrl,
        "_blank",
        "width=600,height=600"
    );

});


/* =====================================================
   EMAIL
===================================================== */

emailBtn.addEventListener("click", () => {

    const subject = encodeURIComponent(
        "Check out this MatchConnect post"
    );

    const body = encodeURIComponent(
        getShareText()
    );

    window.location.href =
        `mailto:?subject=${subject}&body=${body}`;

});


/* =====================================================
   COPY LINK
===================================================== */

copyLinkBtn.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            getPostUrl()
        );

        showMessage("Post link copied!");

    } catch (error) {

        console.error(error);

        showMessage("Unable to copy link.");

    }

});


/* =====================================================
   COPY POST TEXT
===================================================== */

copyTextBtn.addEventListener("click", async () => {

    const text = getPostText();

    if (!text) {

        showMessage("This post has no text.");

        return;
    }

    try {

        await navigator.clipboard.writeText(text);

        showMessage("Post text copied!");

    } catch (error) {

        console.error(error);

        showMessage("Unable to copy text.");

    }

});


/* =====================================================
   SHARE TO MATCHCONNECT GROUP
===================================================== */

groupBtn.addEventListener("click", () => {

    if (!postId) {
        return;
    }

    window.location.href =
        `groups.html?sharePost=${encodeURIComponent(postId)}`;

});


/* =====================================================
   SEND TO MATCHCONNECT CHAT
===================================================== */

chatBtn.addEventListener("click", () => {

    if (!postId) {
        return;
    }

    window.location.href =
        `chats.html?sharePost=${encodeURIComponent(postId)}`;

});


/* =====================================================
   REPOST
===================================================== */

repostBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        showMessage("Please log in first.");

        return;
    }

    if (!postData) {

        showMessage("Post is still loading.");

        return;
    }

    try {

        await addDoc(collection(db, "posts"), {

            content: postData.content || "",

            userId: user.uid,

            username:
                user.displayName ||
                user.email ||
                "MatchConnect User",

            photoURL:
                user.photoURL || "",

            repostOf: postId,

            originalPostId: postId,

            createdAt: serverTimestamp(),

            likes: [],

            comments: 0,

            isRepost: true

        });

        showMessage("Post reposted successfully!");

    } catch (error) {

        console.error("Repost error:", error);

        showMessage("Unable to repost this post.");

    }

});


/* =====================================================
   SAVE POST
===================================================== */

saveBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        showMessage("Please log in first.");

        return;
    }

    try {

        const userRef =
            doc(db, "users", user.uid);

        await updateDoc(userRef, {

            savedPosts: arrayUnion(postId)

        });

        showMessage("Post saved!");

        saveBtn.querySelector("span").textContent =
            "Post Saved";

    } catch (error) {

        console.error("Save error:", error);

        showMessage("Unable to save post.");

    }

});


/* =====================================================
   PIN TO PROFILE
===================================================== */

pinBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        showMessage("Please log in first.");

        return;
    }

    if (!postData) {

        showMessage("Post is still loading.");

        return;
    }

    if (postData.userId !== user.uid) {

        showMessage(
            "You can only pin your own posts."
        );

        return;
    }

    try {

        const userRef =
            doc(db, "users", user.uid);

        await updateDoc(userRef, {

            pinnedPost: postId

        });

        showMessage("Post pinned to your profile!");

    } catch (error) {

        console.error("Pin error:", error);

        showMessage("Unable to pin post.");

    }

});


/* =====================================================
   ADD TO FAVORITES
===================================================== */

favoriteBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        showMessage("Please log in first.");

        return;
    }

    try {

        const userRef =
            doc(db, "users", user.uid);

        await updateDoc(userRef, {

            favoritePosts: arrayUnion(postId)

        });

        showMessage("Added to favorites!");

    } catch (error) {

        console.error(
            "Favorite error:",
            error
        );

        showMessage(
            "Unable to add to favorites."
        );

    }

});


/* =====================================================
   DOWNLOAD IMAGE
===================================================== */

downloadBtn.addEventListener("click", async () => {

    if (!postData) {

        showMessage("Post is still loading.");

        return;
    }

    const imageUrl =
        postData.imageURL ||
        postData.imageUrl ||
        postData.photoURL ||
        postData.image;

    if (!imageUrl) {

        showMessage(
            "This post does not contain an image."
        );

        return;
    }

    try {

        const response =
            await fetch(imageUrl);

        const blob =
            await response.blob();

        const blobUrl =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = blobUrl;

        link.download =
            `matchconnect-post-${postId}.jpg`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(blobUrl);

        showMessage("Image download started.");

    } catch (error) {

        console.error(
            "Download error:",
            error
        );

        /*
         * If Firebase Storage/CORS prevents
         * direct downloading, open the image instead.
         */

        window.open(imageUrl, "_blank");

    }

});


/* =====================================================
   HIDE POST
===================================================== */

hideBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        showMessage("Please log in first.");

        return;
    }

    try {

        const userRef =
            doc(db, "users", user.uid);

        await updateDoc(userRef, {

            hiddenPosts: arrayUnion(postId)

        });

        showMessage("Post hidden from your feed.");

        setTimeout(() => {

            closeShareSheet();

        }, 700);

    } catch (error) {

        console.error(
            "Hide post error:",
            error
        );

        showMessage(
            "Unable to hide this post."
        );

    }

});


/* =====================================================
   REPORT POST
===================================================== */

reportBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        showMessage("Please log in first.");

        return;
    }

    if (!postId) {
        return;
    }

    const reason =
        prompt(
            "Why are you reporting this post?"
        );

    if (!reason) {
        return;
    }

    try {

        await addDoc(
            collection(db, "reports"),
            {

                postId: postId,

                reportedBy: user.uid,

                reason: reason,

                createdAt:
                    serverTimestamp(),

                status: "pending"

            }
        );

        showMessage(
            "Thank you. Your report has been submitted."
        );

    } catch (error) {

        console.error(
            "Report error:",
            error
        );

        showMessage(
            "Unable to submit report."
        );

    }

});


/* =====================================================
   CANCEL
===================================================== */

cancelBtn.addEventListener(
    "click",
    closeShareSheet
);


/* =====================================================
   OVERLAY CLICK
===================================================== */

overlay.addEventListener(
    "click",
    closeShareSheet
);


/* =====================================================
   CLOSE SHARE SHEET
===================================================== */

function closeShareSheet() {

    shareSheet.style.animation =
        "shareSheetDown 0.25s ease-in forwards";

    overlay.style.opacity = "0";

    setTimeout(() => {

        window.history.back();

    }, 230);

}


/* =====================================================
   ADD CLOSE ANIMATION
===================================================== */

const closeAnimationStyle =
    document.createElement("style");

closeAnimationStyle.textContent = `

@keyframes shareSheetDown {

    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(100%);
    }

}

`;

document.head.appendChild(
    closeAnimationStyle
);


/* =====================================================
   BUTTON STATE
===================================================== */

async function updateButtonStates() {

    const user = auth.currentUser;

    if (!user || !postData) {
        return;
    }

    /*
     * Pin is only available for the
     * owner's own post.
     */

    if (postData.userId !== user.uid) {

        pinBtn.style.display = "none";

    }

    try {

        const userSnap =
            await getDoc(
                doc(db, "users", user.uid)
            );

        if (!userSnap.exists()) {
            return;
        }

        const userData =
            userSnap.data();

        const savedPosts =
            userData.savedPosts || [];

        const favoritePosts =
            userData.favoritePosts || [];

        if (savedPosts.includes(postId)) {

            saveBtn.querySelector(
                "span"
            ).textContent = "Post Saved";

        }

        if (favoritePosts.includes(postId)) {

            favoriteBtn.querySelector(
                "span"
            ).textContent = "In Favorites";

        }

    } catch (error) {

        console.error(
            "Button state error:",
            error
        );

    }

}


/* =====================================================
   MESSAGE / TOAST
===================================================== */

function showMessage(message) {

    let toast =
        document.getElementById(
            "shareToast"
        );

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "shareToast";

        toast.style.position = "fixed";
        toast.style.left = "50%";
        toast.style.bottom = "30px";
        toast.style.transform =
            "translateX(-50%)";

        toast.style.background =
            "rgba(0,0,0,0.85)";

        toast.style.color = "#fff";

        toast.style.padding =
            "11px 18px";

        toast.style.borderRadius =
            "20px";

        toast.style.fontSize =
            "14px";

        toast.style.zIndex =
            "2000";

        toast.style.maxWidth =
            "90%";

        toast.style.textAlign =
            "center";

        document.body.appendChild(
            toast
        );

    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(
        toast.hideTimer
    );

    toast.hideTimer =
        setTimeout(() => {

            toast.style.display =
                "none";

        }, 2500);

}


/* =====================================================
   START
===================================================== */

loadPost();
