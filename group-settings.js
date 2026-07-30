import { auth, db, storage } from "./firebase.js";
import {
    doc,
    getDoc,
    updateDoc,
    arrayRemove,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// Elements

const groupName =
document.getElementById("groupName");

const groupPhoto =
document.getElementById("groupPhoto");


const addMembersBtn =
document.getElementById("addMembersBtn");


const viewMembersBtn =
document.getElementById("viewMembersBtn");


const reportGroupBtn =
document.getElementById("reportGroupBtn");


const leaveGroupBtn =
document.getElementById("leaveGroupBtn");

const changePhotoBtn =
document.getElementById("changePhotoBtn");

const groupPhotoInput =
document.getElementById("groupPhotoInput");

// Get group ID from URL

const params =
new URLSearchParams(window.location.search);


const groupId =
params.get("groupId");



let currentUser;



onAuthStateChanged(auth, async(user)=>{


    if(!user){

        location.href="login.html";
        return;

    }


    currentUser = user;



    if(!groupId){

        alert("Group not found");
        return;

    }



    const groupRef =
    doc(db,"groups",groupId);



    const groupSnap =
    await getDoc(groupRef);



    if(!groupSnap.exists()){

        alert("Group does not exist");
        return;

    }



    const group =
    groupSnap.data();



    if(groupName){

        groupName.textContent =
        group.name;

    }



    if(groupPhoto){

        groupPhoto.src =
        group.photoURL ||
        "images/default-avatar.png";

    }



});




// ADD MEMBERS

if(addMembersBtn){


addMembersBtn.onclick = ()=>{


    location.href =
    `add-group-members.html?groupId=${groupId}`;


};


}




// VIEW MEMBERS

if(viewMembersBtn){


viewMembersBtn.onclick = ()=>{


    location.href =
    `group-members.html?groupId=${groupId}`;


};


}





// REPORT GROUP

if(reportGroupBtn){


reportGroupBtn.onclick = async()=>{


    const reason =
    prompt(
    "Why are you reporting this group?"
    );



    if(!reason) return;



    await addDoc(
        collection(db,"reports"),
        {

            type:"group",

            groupId:groupId,

            reporterId:
            currentUser.uid,

            reason:reason,

            createdAt:
            serverTimestamp()

        }
    );



    alert(
    "Group reported successfully"
    );


};


}





// LEAVE GROUP

if(leaveGroupBtn){


leaveGroupBtn.onclick = async()=>{


    const confirmLeave =
    confirm(
    "Are you sure you want to leave this group?"
    );



    if(!confirmLeave) return;



    const groupRef =
    doc(db,"groups",groupId);



    await updateDoc(
        groupRef,
        {

            members:
            arrayRemove(
            currentUser.uid
            )

        }
    );



    alert(
    "You left the group"
    );



    location.href="chats.html";


};


      }

const changeNameBtn =
document.getElementById("changeNameBtn");



if(changeNameBtn){

    changeNameBtn.onclick = async()=>{


        const newName =
        prompt("Enter new group name");


        if(!newName || newName.trim() === ""){
            return;
        }


        await updateDoc(
            doc(db,"groups",groupId),
            {
                name:newName.trim()
            }
        );


        alert("Group name updated ✅");


        location.reload();

    };

}

if(changePhotoBtn){

    changePhotoBtn.onclick = ()=>{

        groupPhotoInput.click();

    };

}
