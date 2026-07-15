import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// Back button

document.getElementById("backBtn").onclick = () => {

    history.back();

};



// Switches

const profileVisibility =
document.getElementById("profileVisibility");

const onlineStatus =
document.getElementById("onlineStatus");

const allowMessages =
document.getElementById("allowMessages");



let currentUser;



// Load privacy settings

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";
        return;

    }


    currentUser = user;


    const userRef = doc(
        db,
        "users",
        user.uid
    );


    const snap = await getDoc(userRef);



    if(snap.exists()){


        const data = snap.data();


        const privacy =
        data.privacy || {};



        profileVisibility.checked =
        privacy.profileVisibility ?? true;


        onlineStatus.checked =
        privacy.onlineStatus ?? true;


        allowMessages.checked =
        privacy.allowMessages ?? true;


    }



});





// Save function

async function savePrivacy(){


    if(!currentUser) return;


    const userRef =
    doc(
        db,
        "users",
        currentUser.uid
    );



    await setDoc(

        userRef,

        {

            privacy:{

                profileVisibility:
                profileVisibility.checked,


                onlineStatus:
                onlineStatus.checked,


                allowMessages:
                allowMessages.checked

            }

        },

        {
            merge:true
        }

    );


}





// Listen for changes

profileVisibility.onchange =
savePrivacy;


onlineStatus.onchange =
savePrivacy;


allowMessages.onchange =
savePrivacy;
