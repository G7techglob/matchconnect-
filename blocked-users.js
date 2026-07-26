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


// BACK BUTTON

const backBtn = document.getElementById("backBtn");

if(backBtn){

    backBtn.onclick = () => {
        history.back();
    };

}


// BLOCKED USERS CONTAINER

const blockedList =
document.getElementById("blockedList");


// CHECK LOGIN

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href = "login.html";
        return;

    }


    try{


        // FIND USERS BLOCKED BY CURRENT USER

        const q = query(
            collection(db,"blockedUsers"),
            where(
                "blockerId",
                "==",
                user.uid
            )
        );


        const snapshot =
        await getDocs(q);



        // NO BLOCKED USERS

        if(snapshot.empty){

            blockedList.innerHTML = `

            <p class="empty">
            No blocked users
            </p>

            `;

            return;

        }



        blockedList.innerHTML = "";



        // DISPLAY EACH BLOCKED USER

        snapshot.forEach(async(blockDoc)=>{


            const blockData =
            blockDoc.data();



            const userSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    blockData.blockedUserId
                )
            );



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
                "images/default-avatar.png"
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



                // UNBLOCK BUTTON

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



                    if(blockedList.children.length === 0){

                        blockedList.innerHTML = `

                        <p class="empty">
                        No blocked users
                        </p>

                        `;

                    }


                };



                blockedList.appendChild(div);


            }


        });



    }catch(error){


        console.error(
            "Blocked users error:",
            error
        );


    }



});
