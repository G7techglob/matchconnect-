import { auth, db } from "./firebase.js";


import {
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";



const membersList =
document.getElementById("membersList");



const params =
new URLSearchParams(window.location.search);


const groupId =
params.get("groupId");




onAuthStateChanged(auth, async(user)=>{


if(!user){

location.href="login.html";
return;

}



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



membersList.innerHTML="";



for(const memberId of group.members){



const userRef =
doc(db,"users",memberId);



const userSnap =
await getDoc(userRef);



if(!userSnap.exists())
continue;



const member =
userSnap.data();



const div =
document.createElement("div");


div.className="member-item";



div.innerHTML=`

<img 
src="${member.photoURL || 'images/default-avatar.png'}">


<div>

<h3>
${member.name || "User"}
</h3>

<p>
Group member
</p>

</div>

`;

  div.onclick = ()=>{

    window.location.href =
    `user.html?uid=${memberId}`;

};



membersList.appendChild(div);



}



});
