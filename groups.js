import { auth, db } from "./firebase.js";


import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";



const groupsList =
document.getElementById("groupsList");



onAuthStateChanged(auth,(user)=>{


    if(!user){

        window.location.href="login.html";
        return;

    }



    const groupsRef =
    collection(db,"groups");



    const q =
    query(
        groupsRef,
        where(
            "members",
            "array-contains",
            user.uid
        )
    );



    onSnapshot(q,(snapshot)=>{


        groupsList.innerHTML="";



        if(snapshot.empty){

            groupsList.innerHTML =
            "<p>No groups yet.</p>";

            return;

        }



        snapshot.forEach((doc)=>{


            const group =
            doc.data();



            const card =
            document.createElement("div");


            card.className =
            "group-card";



            card.innerHTML = `

            <img 
            src="${group.photoURL || 'images/default-avatar.png'}"
            class="group-photo">


            <div>

            <div class="group-name">
            ${group.name}
            </div>

            </div>

            `;



            card.onclick = ()=>{


                window.location.href =
                `group-chat.html?groupId=${doc.id}`;


            };



            groupsList.appendChild(card);


        });



    });



});
