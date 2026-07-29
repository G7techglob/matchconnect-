import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
const groupPhoto = document.getElementById("groupPhoto");
const groupPreview = document.getElementById("groupPreview");
const createGroupBtn = document.getElementById("createGroupBtn");
const groupName = document.getElementById("groupName");
const friendsList = document.getElementById("friendsList");
const openMembersBtn = document.getElementById("openMembersBtn");

const searchFriend = document.getElementById("searchFriend");
openMembersBtn.addEventListener("click", ()=>{

    if(friendsList.style.display === "block"){

        friendsList.style.display = "none";

    }else{

        friendsList.style.display = "block";

    }

});
// Preview selected group photo
groupPhoto.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (file) {
        groupPreview.src = URL.createObjectURL(file);
    }
});

onAuthStateChanged(auth, async (user)=>{

    if(!user){
        window.location.href="login.html";
        return;
    }


    const followersRef = collection(
        db,
        "users",
        user.uid,
        "followers"
    );


    const followersSnap = await getDocs(followersRef);


    for(const followerDoc of followersSnap.docs){


        const followerId =
        followerDoc.data().userId || followerDoc.id;


        const userSnap = await getDoc(
            doc(db,"users",followerId)
        );


        if(!userSnap.exists()){
            continue;
        }


        const follower = userSnap.data();


        const item = document.createElement("div");

        item.className = "friend-item";


        item.innerHTML = `

        <div class="friend-info">

            <img 
            src="${follower.photoURL || 'images/default-avatar.png'}"
            class="friend-photo">

            <span>
            ${follower.name || "User"}
            </span>

        </div>


        <input
        type="checkbox"
        value="${followerId}"
        class="memberCheck">

        `;


        item.dataset.name =
(follower.name || "User").toLowerCase();


friendsList.appendChild(item);
});

// Create group button
createGroupBtn.addEventListener("click", async () => {
    

    const user = auth.currentUser;

    if (!user) {
        alert("Please log in first.");
        return;
    }

    const name = groupName.value.trim();

    if (name === "") {
        alert("Enter a group name.");
        return;
    }

    const selectedMembers = [];

    document.querySelectorAll(".memberCheck:checked").forEach(box => {
        selectedMembers.push(box.value);
    });

    // Include the creator
    if (!selectedMembers.includes(user.uid)) {
        selectedMembers.push(user.uid);
    }

    console.log("Group Name:", name);
console.log("Members:", selectedMembers);


try {

    const groupRef = await addDoc(
        collection(db, "groups"),
        {

            name: name,

            createdBy: user.uid,

            members: selectedMembers,

            photoURL: "",

            createdAt: serverTimestamp()

        }
    );


    console.log("Created Group ID:", groupRef.id);


    alert("Group created successfully");


    window.location.href =
    `group-chat.html?groupId=${groupRef.id}`;


} catch(error) {

    console.error("Error creating group:", error);

    alert(error.message);
}
    
});
    searchFriend.addEventListener("input", ()=>{

    const searchText =
    searchFriend.value.toLowerCase();


    const members =
    document.querySelectorAll(".friend-item");


    members.forEach(member=>{


        const name =
        member.dataset.name;


        if(name.includes(searchText)){

            member.style.display = "flex";

        }else{

            member.style.display = "none";

        }

    });

});
