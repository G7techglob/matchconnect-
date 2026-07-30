import { auth, db } from "./firebase.js";


import {
collection,
getDocs,
doc,
getDoc,
updateDoc,
arrayUnion
} 
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";



const usersList =
document.getElementById("usersList");


const addSelectedBtn =
document.getElementById("addSelectedBtn");



const params =
new URLSearchParams(window.location.search);


const groupId =
params.get("groupId");



let selectedUsers = [];



let currentUser;



onAuthStateChanged(auth, async(user)=>{


if(!user){

location.href="login.html";
return;

}


currentUser=user;



loadUsers();


});





async function loadUsers(){


const usersSnap =
await getDocs(
collection(db,"users")
);



usersList.innerHTML="";



usersSnap.forEach((userDoc)=>{


if(userDoc.id === currentUser.uid)
return;



const user =
userDoc.data();



const div =
document.createElement("div");


div.className="user-item";



div.innerHTML=`

<input 
type="checkbox"
value="${userDoc.id}">


<img 
src="${user.photoURL || 'images/default-avatar.png'}">


<p>
${user.name || "User"}
</p>

`;



const checkbox =
div.querySelector("input");



checkbox.addEventListener(
"change",
()=>{


if(checkbox.checked){


selectedUsers.push(
userDoc.id
);


}else{


selectedUsers =
selectedUsers.filter(
id=>id !== userDoc.id
);


}


});



usersList.appendChild(div);



});


}





addSelectedBtn.onclick =
async()=>{


if(selectedUsers.length===0){

alert(
"Select members first"
);

return;

}



const groupRef =
doc(db,"groups",groupId);



await updateDoc(
groupRef,
{

members:
arrayUnion(
...selectedUsers
)

}
);



alert(
"Members added successfully"
);



location.href =
`group-chat.html?groupId=${groupId}`;


};
