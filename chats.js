import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc,
    where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


const chatList = document.getElementById("chatList");


function loading(){
    chatList.innerHTML = `
    <div class="empty-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading conversations...</p>
    </div>
    `;
}


function empty(){

    chatList.innerHTML = "";

}


function timeFormat(timestamp){

    if(!timestamp) return "";

    const date = timestamp.toDate();

    return date.toLocaleString([],{
        hour:"2-digit",
        minute:"2-digit"
    });
}



onAuthStateChanged(auth, async(user)=>{


if(!user){
    location.href="login.html";
    return;
}


loading();



const usersSnap = await getDocs(
    collection(db,"users")
);


let conversations=[];



for(const userDoc of usersSnap.docs){


    if(userDoc.id === user.uid) continue;


    const otherUser=userDoc.data();


    const chatId=[user.uid,userDoc.id]
    .sort()
    .join("_");



    const messagesQuery=query(
        collection(db,"chats",chatId,"messages"),
        orderBy("time","desc"),
        limit(1)
    );


    const messagesSnap=await getDocs(messagesQuery);



    if(messagesSnap.empty) continue;



    const lastMessage=
    messagesSnap.docs[0].data();



    conversations.push({

        uid:userDoc.id,

        name:
        otherUser.name ||
        otherUser.username ||
        "User",

        photo:
        otherUser.photoURL ||
        "images/default-avatar.png",

        online:
        otherUser.online || false,


        message:
        lastMessage.text ||
        "📷 Image",


        time:
        lastMessage.time,


        unread:
        lastMessage.receiverId===user.uid &&
        lastMessage.seen===false

    });



}




if(conversations.length===0){

    empty();
    return;

}



conversations.sort((a,b)=>{

return b.time?.seconds-a.time?.seconds;

});



chatList.innerHTML="";



conversations.forEach(chat=>{


const div=document.createElement("div");


div.className="chat-item";



div.innerHTML=`

<img class="avatar"
src="${chat.photo}">


<div class="chat-main">


<div class="chat-top">

<p class="chat-name">
${chat.name}
</p>


<p class="chat-time">
${timeFormat(chat.time)}
</p>


</div>



<p class="chat-message">

${chat.message}

</p>



</div>


<div>

${chat.online ?
'<i class="fa-solid fa-circle" style="color:green;font-size:10px"></i>'
:
''
}


${chat.unread ?
'<span class="badge">1</span>'
:
''}


</div>

`;



div.onclick=()=>{

location.href=
`chat.html?uid=${chat.uid}`;

};



chatList.appendChild(div);



});



});

document.getElementById("chatSettingsBtn").onclick = ()=>{

    location.href = "chat-settings.html";

};

const groupsList = document.getElementById("groupsList");

if(!groupsList){
    console.log("groupsList not found");
}


onAuthStateChanged(auth,(user)=>{


    if(!user) return;


    const groupsQuery = query(
        collection(db,"groups"),
        where(
            "members",
            "array-contains",
            user.uid
        )
    );


    onSnapshot(groupsQuery,(snapshot)=>{

        console.log("Groups found:", snapshot.size);

        if(!groupsList) return;


        groupsList.innerHTML="";


        if(snapshot.empty){

            groupsList.innerHTML =
            "<p>No groups yet</p>";

            return;

        }


        snapshot.forEach((groupDoc)=>{


            const group =
            groupDoc.data();


            const div =
            document.createElement("div");


            div.className="chat-item";


            div.innerHTML=`

            <img 
            class="avatar"
            src="${group.photoURL || 'images/default-avatar.png'}">


            <div class="chat-main">

            <p class="chat-name">
            ${group.name}
            </p>


            <p class="chat-message">
            Group chat
            </p>


            </div>

            `;


            div.onclick=()=>{


                location.href =
                `group-chat.html?groupId=${groupDoc.id}`;


            };


            groupsList.appendChild(div);


        });


    });


});

// =========================
// CHAT SEARCH
// =========================

const searchBtn = document.getElementById("searchBtn");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const chatSearchInput = document.getElementById("chatSearchInput");
const chatTitle = document.querySelector(".chat-header h1");


if(searchBtn){

    searchBtn.onclick = ()=>{

        searchBtn.style.display = "none";

        if(chatTitle){
            chatTitle.style.display = "none";
        }

        chatSearchInput.style.display = "block";

        closeSearchBtn.style.display = "flex";

        chatSearchInput.focus();

    };

}



if(closeSearchBtn){

    closeSearchBtn.onclick = ()=>{

        chatSearchInput.style.display = "none";

        closeSearchBtn.style.display = "none";

        searchBtn.style.display = "flex";


        if(chatTitle){
            chatTitle.style.display = "block";
        }


        chatSearchInput.value = "";


        document.querySelectorAll(".chat-item")
        .forEach(item=>{

            item.style.display="flex";

        });

    };

}



// FILTER CHATS

if(chatSearchInput){

chatSearchInput.addEventListener("input",()=>{


    const text =
    chatSearchInput.value.toLowerCase();



    document.querySelectorAll(".chat-item")
    .forEach(item=>{


        const name =
        item.querySelector(".chat-name")
        ?.textContent
        .toLowerCase();



        if(name && name.includes(text)){

            item.style.display="flex";

        }else{

            item.style.display="none";

        }


    });


});


}
