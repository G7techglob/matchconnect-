import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const uid =
new URLSearchParams(location.search)
.get("uid");


const grid =
document.getElementById("photosGrid");


const snap =
await getDocs(
collection(db,"users",uid,"photos")
);


snap.forEach(doc=>{

const photo =
doc.data();


grid.innerHTML += `

<img 
src="${photo.imageURL}"
class="profile-media">

`;

});
