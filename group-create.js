import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const groupPhoto = document.getElementById("groupPhoto");
const groupPreview = document.getElementById("groupPreview");
const createGroupBtn = document.getElementById("createGroupBtn");
const groupName = document.getElementById("groupName");
const friendsList = document.getElementById("friendsList");

// Preview selected group photo
groupPhoto.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (file) {
        groupPreview.src = URL.createObjectURL(file);
    }
});

// Temporary sample friends
const friends = [
    { uid: "user1", name: "John" },
    { uid: "user2", name: "Sarah" },
    { uid: "user3", name: "David" },
    { uid: "user4", name: "Michael" }
];

// Display friends
friends.forEach(friend => {

    const item = document.createElement("div");
    item.className = "friend-item";

    item.innerHTML = `
        <div class="friend-info">
            <span>${friend.name}</span>
        </div>

        <input
            type="checkbox"
            value="${friend.uid}"
            class="memberCheck">
    `;

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
