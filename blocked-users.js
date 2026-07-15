import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// Back button

document.getElementById("backBtn").onclick = () => {

    history.back();

};



const blockedList =
document.getElementById("blockedList");



onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";
        return;

    }



    const userRef =
    doc(db,"users",user.uid);



    const snap =
    await getDoc(userRef);



    if(!snap.exists()) return;



    const data =
    snap.data();



    const blockedUsers =
    data.blockedUsers || [];



    if(blockedUsers.length === 0){

        blockedList.innerHTML = `
            <p class="empty">
                No blocked users
            </p>
        `;

        return;

    }



    blockedList.innerHTML = "";



    blockedUsers.forEach(async(uid)=>{


        const blockedRef =
        doc(db,"users",uid);



        const blockedSnap =
        await getDoc(blockedRef);



        if(blockedSnap.exists()){


            const blockedData =
            blockedSnap.data();



            const div =
            document.createElement("div");


            div.className =
            "user-item";



            div.innerHTML = `

                <div class="user-info">

                    <img src="${
                        blockedData.photoURL ||
                        "assets/images/default-profile.png"
                    }">


                    <span class="username">

                        ${
                            blockedData.name ||
                            blockedData.username ||
                            "User"
                        }

                    </span>


                </div>


                <button class="unblock-btn">

                    Unblock

                </button>

            `;



            div.querySelector(".unblock-btn")
            .onclick = async()=>{


                await updateDoc(
                    userRef,
                    {
                        blockedUsers:
                        arrayRemove(uid)
                    }
                );


                div.remove();


            };



            blockedList.appendChild(div);


        }


    });


});
