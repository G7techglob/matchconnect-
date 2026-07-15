import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// Back button

document.getElementById("backBtn").onclick = () => {

    history.back();

};



// Notification switches

const likesNotification =
document.getElementById("likesNotification");

const commentsNotification =
document.getElementById("commentsNotification");

const messagesNotification =
document.getElementById("messagesNotification");

const followersNotification =
document.getElementById("followersNotification");



let currentUser;



// Load settings

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";
        return;

    }


    currentUser = user;



    const userRef =
    doc(db,"users",user.uid);



    const snap =
    await getDoc(userRef);



    if(snap.exists()){


        const data =
        snap.data();


        const notifications =
        data.notifications || {};



        likesNotification.checked =
        notifications.likes ?? true;


        commentsNotification.checked =
        notifications.comments ?? true;


        messagesNotification.checked =
        notifications.messages ?? true;


        followersNotification.checked =
        notifications.followers ?? true;


    }



});




// Save function

async function saveNotifications(){


    if(!currentUser) return;



    const userRef =
    doc(db,"users",currentUser.uid);



    await setDoc(

        userRef,

        {

            notifications:{

                likes:
                likesNotification.checked,


                comments:
                commentsNotification.checked,


                messages:
                messagesNotification.checked,


                followers:
                followersNotification.checked

            }

        },

        {
            merge:true
        }

    );


}





// Listen for changes

likesNotification.onchange =
saveNotifications;


commentsNotification.onchange =
saveNotifications;


messagesNotification.onchange =
saveNotifications;


followersNotification.onchange =
saveNotifications;
