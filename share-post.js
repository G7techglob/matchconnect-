/* =====================================================
   MATCHCONNECT - SHARE POST
   File: share-post.js
===================================================== */

import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =====================================================
   GET ELEMENTS
===================================================== */

const overlay =
    document.getElementById("overlay");

const shareSheet =
    document.getElementById("shareSheet");

const whatsappBtn =
    document.getElementById("whatsappBtn");

const facebookBtn =
    document.getElementById("facebookBtn");

const telegramBtn =
    document.getElementById("telegramBtn");

const messengerBtn =
    document.getElementById("messengerBtn");

const emailBtn =
    document.getElementById("emailBtn");

const groupBtn =
    document.getElementById("groupBtn");

const chatBtn =
    document.getElementById("chatBtn");

const repostBtn =
    document.getElementById("repostBtn");

const copyLinkBtn =
    document.getElementById("copyLinkBtn");

const cancelBtn =
    document.getElementById("cancelBtn");


/* =====================================================
   GET POST ID
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );

const postId =
    params.get("id");


/* =====================================================
   POST DATA
===================================================== */

let postData = null;


/* =====================================================
   LOAD POST
===================================================== */

async function loadPost() {

    if (!postId) {

        console.error(
            "No post ID found."
        );

        showMessage(
            "Post not found."
        );

        return;
    }


    try {

        const postRef =
            doc(
                db,
                "posts",
                postId
            );


        const postSnap =
            await getDoc(
                postRef
            );


        if (!postSnap.exists()) {

            console.error(
                "Post does not exist."
            );

            showMessage(
                "This post no longer exists."
            );

            return;
        }


        postData = {

            id: postSnap.id,

            ...postSnap.data()

        };


        console.log(
            "Post loaded:",
            postData
        );


    } catch (error) {

        console.error(
            "Error loading post:",
            error
        );

        showMessage(
            "Unable to load this post."
        );

    }

}


/* =====================================================
   POST URL
===================================================== */

function getPostUrl() {

    return (
        `${window.location.origin}` +
        `/matchconnect-/post.html?id=` +
        encodeURIComponent(postId)
    );

}


/* =====================================================
   POST TEXT
===================================================== */

function getPostText() {

    if (!postData) {

        return "";

    }


    return (
        postData.content ||
        postData.text ||
        ""
    );

}


/* =====================================================
   SHARE TEXT
===================================================== */

function getShareText() {

    const text =
        getPostText();

    const url =
        getPostUrl();


    return text
        ? `${text}\n\n${url}`
        : url;

}


/* =====================================================
   WHATSAPP
===================================================== */

if (whatsappBtn) {

    whatsappBtn.addEventListener(
        "click",
        () => {

            const text =
                encodeURIComponent(
                    getShareText()
                );


            const url =
                `https://wa.me/?text=${text}`;


            window.open(
                url,
                "_blank"
            );

        }
    );

}


/* =====================================================
   FACEBOOK
===================================================== */

if (facebookBtn) {

    facebookBtn.addEventListener(
        "click",
        () => {

            const url =
                encodeURIComponent(
                    getPostUrl()
                );


            const shareUrl =
                `https://www.facebook.com/sharer/sharer.php?u=${url}`;


            window.open(
                shareUrl,
                "_blank",
                "width=600,height=500"
            );

        }
    );

}


/* =====================================================
   TELEGRAM
===================================================== */

if (telegramBtn) {

    telegramBtn.addEventListener(
        "click",
        () => {

            const url =
                encodeURIComponent(
                    getPostUrl()
                );


            const text =
                encodeURIComponent(
                    getPostText()
                );


            const shareUrl =
                `https://t.me/share/url?url=${url}&text=${text}`;


            window.open(
                shareUrl,
                "_blank"
            );

        }
    );

}


/* =====================================================
   MESSENGER
===================================================== */

if (messengerBtn) {

    messengerBtn.addEventListener(
        "click",
        () => {

            const url =
                encodeURIComponent(
                    getPostUrl()
                );


            /*
             * Facebook Messenger sharing
             * may require a configured
             * Facebook App ID.
             */

            const shareUrl =
                `https://www.facebook.com/dialog/send?link=${url}&app_id=YOUR_FACEBOOK_APP_ID`;


            window.open(
                shareUrl,
                "_blank",
                "width=600,height=600"
            );

        }
    );

}


/* =====================================================
   EMAIL
===================================================== */

if (emailBtn) {

    emailBtn.addEventListener(
        "click",
        () => {

            const subject =
                encodeURIComponent(
                    "Check out this MatchConnect post"
                );


            const body =
                encodeURIComponent(
                    getShareText()
                );


            window.location.href =
                `mailto:?subject=${subject}&body=${body}`;

        }
    );

}


/* =====================================================
   COPY POST LINK
===================================================== */

if (copyLinkBtn) {

    copyLinkBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    getPostUrl()
                );


                showMessage(
                    "Post link copied!"
                );


            } catch (error) {

                console.error(
                    "Copy link error:",
                    error
                );


                showMessage(
                    "Unable to copy link."
                );

            }

        }
    );

}


/* =====================================================
   SHARE TO MATCHCONNECT GROUP
===================================================== */

if (groupBtn) {

    groupBtn.addEventListener(
        "click",
        () => {

            if (!postId) {

                showMessage(
                    "Post not found."
                );

                return;
            }


            window.location.href =
                `groups.html?sharePost=${encodeURIComponent(postId)}`;

        }
    );

}


/* =====================================================
   SEND TO MATCHCONNECT CHAT
===================================================== */

if (chatBtn) {

    chatBtn.addEventListener(
        "click",
        () => {

            if (!postId) {

                showMessage(
                    "Post not found."
                );

                return;
            }


            window.location.href =
                `chats.html?sharePost=${encodeURIComponent(postId)}`;

        }
    );

}


/* =====================================================
   REPOST
===================================================== */

if (repostBtn) {

    repostBtn.addEventListener(
        "click",
        async () => {

            const user =
                auth.currentUser;


            if (!user) {

                showMessage(
                    "Please log in first."
                );

                return;
            }


            if (!postData) {

                showMessage(
                    "Post is still loading."
                );

                return;
            }


            try {

                await addDoc(
                    collection(
                        db,
                        "posts"
                    ),
                    {

                        content:
                            postData.content || "",

                        userId:
                            user.uid,

                        username:
                            user.displayName ||
                            user.email ||
                            "MatchConnect User",

                        photoURL:
                            user.photoURL || "",

                        repostOf:
                            postId,

                        originalPostId:
                            postId,

                        createdAt:
                            serverTimestamp(),

                        likes: [],

                        comments: 0,

                        isRepost: true

                    }
                );


                showMessage(
                    "Post reposted successfully!"
                );


            } catch (error) {

                console.error(
                    "Repost error:",
                    error
                );


                showMessage(
                    "Unable to repost this post."
                );

            }

        }
    );

}


/* =====================================================
   CANCEL
===================================================== */

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        closeShareSheet
    );

}


/* =====================================================
   OVERLAY CLICK
===================================================== */

if (overlay) {

    overlay.addEventListener(
        "click",
        closeShareSheet
    );

}


/* =====================================================
   CLOSE SHARE SHEET
===================================================== */

function closeShareSheet() {

    if (shareSheet) {

        shareSheet.style.animation =
            "shareSheetDown 0.25s ease-in forwards";

    }


    if (overlay) {

        overlay.style.opacity =
            "0";

    }


    setTimeout(
        () => {

            window.history.back();

        },
        230
    );

}


/* =====================================================
   CLOSE ANIMATION
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
   TOAST MESSAGE
===================================================== */

function showMessage(message) {

    let toast =
        document.getElementById(
            "shareToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "shareToast";


        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "30px";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.background =
            "rgba(0,0,0,0.85)";

        toast.style.color =
            "#fff";

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


    toast.textContent =
        message;


    toast.style.display =
        "block";


    clearTimeout(
        toast.hideTimer
    );


    toast.hideTimer =
        setTimeout(
            () => {

                toast.style.display =
                    "none";

            },
            2500
        );

}


/* =====================================================
   START
===================================================== */

loadPost();
