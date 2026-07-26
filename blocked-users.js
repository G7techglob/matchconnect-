import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// Back button

const backBtn =
document.getElementById("backBtn");


if(backBtn){

    backBtn.onclick = () => {

        history.back();

    };

}



const blockedList =
document.getElementById("blockedList");



onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";
        return;

    }



    const q =
    query(
        collection(db,"blockedUsers"),
        where(
            "blockerId",
            "==",
            user.uid
        )
    );



    const snapshot =
    await getDocs(q);



    if(snapshot.empty){

        blockedList.innerHTML = `
        <p class="empty">
        No blocked users
        </p>
        `;

        return;

    }



    blockedList.innerHTML = "";



    snapshot.forEach(async(blockDoc)=>{


        const blockData =
        blockDoc.data();



        const userRef =
        doc(
            db,
            "users",
            blockData.blockedUserId
        );



        const userSnap =
        await getDoc(userRef);



        if(userSnap.exists()){


            const userData =
            userSnap.data();



            const div =
            document.createElement("div");


            div.className =
            "user-item";



            div.innerHTML = `

            <div class="user-info">

            <img src="${
            userData.photoURL ||
            "assets/images/default-profile.png"
            }">


            <span class="username">
            ${
            userData.name ||
            userData.username ||
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


                await deleteDoc(
                    doc(
                    db,
                    "blockedUsers",
                    blockDoc.id
                    )
                );


                div.remove();


            };



            blockedList.appendChild(div);


        }


    });


});
