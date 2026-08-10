import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
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

// =========================
// LOAD GROUPS
// =========================

const activeGroupsSnap = await getDocs(
    query(
        collection(db, "groups"),
        where("members", "array-contains", user.uid)
    )
);


const formerGroupsSnap = await getDocs(
    query(
        collection(db, "groups"),
        where("formerMembers", "array-contains", user.uid)
    )
);


// Combine active and former groups
const groupDocsMap = new Map();


// Active groups
activeGroupsSnap.docs.forEach(groupDoc => {

    groupDocsMap.set(
        groupDoc.id,
        {
            groupDoc,
            isMember: true
        }
    );

});


// Groups the user previously left
formerGroupsSnap.docs.forEach(groupDoc => {

    // Don't overwrite active membership
    if (!groupDocsMap.has(groupDoc.id)) {

        groupDocsMap.set(
            groupDoc.id,
            {
                groupDoc,
                isMember: false
            }
        );

    }

});


// Load every group
for (const {
    groupDoc,
    isMember
} of groupDocsMap.values()) {

    const group = groupDoc.data();


    // =========================
    // GET LAST MESSAGE
    // =========================

    const lastMessageQuery = query(
        collection(
            db,
            "groups",
            groupDoc.id,
            "messages"
        ),
        orderBy("time", "desc"),
        limit(1)
    );


    const lastMessageSnap =
        await getDocs(lastMessageQuery);


    let message = "Group created";
    let time = null;


    if (!lastMessageSnap.empty) {

        const last =
            lastMessageSnap.docs[0].data();


        message =
            last.text ||
            "📷 Image";


        time =
            last.time;

    }


    // =========================
    // GROUP SETTINGS
    // =========================

    const groupSettingsSnap =
        await getDoc(
            doc(
                db,
                "groupSettings",
                user.uid + "_" + groupDoc.id
            )
        );


    const groupPinned =
        groupSettingsSnap.exists() &&
        groupSettingsSnap.data().pinned === true;


    // =========================
    // ADD GROUP TO CONVERSATIONS
    // =========================

    conversations.push({

        isGroup: true,

        groupId:
            groupDoc.id,

        pinned:
            groupPinned,

        name:
            group.name ||
            "Group",

        photo:
            group.photoURL ||
            "images/default-avatar.png",

        online: false,

        message:
            message,

        time:
            time,

        unread: false,

        // NEW
        isMember:
            isMember

    });

        }


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


    const settingsSnap = await getDoc(
    doc(db, "chatSettings", user.uid + "_" + userDoc.id)
);

const pinned =
    settingsSnap.exists() &&
    settingsSnap.data().pinned === true;

    conversations.push({

        uid:userDoc.id,
        pinned: pinned,

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



conversations.sort((a, b) => {

    // Pinned chats always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // If both are pinned (or both are not pinned),
    // sort by latest message time.
    const timeA = a.time?.seconds || 0;
    const timeB = b.time?.seconds || 0;

    return timeB - timeA;

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
${chat.pinned ? "📌 " : ""}${chat.name}
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

${!chat.isGroup && chat.online ?
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

    if(chat.isGroup){

        location.href =
        `group-chat.html?groupId=${chat.groupId}`;

    }else{

        location.href =
        `chat.html?uid=${chat.uid}`;

    }

};



chatList.appendChild(div);



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

// =========================
// CHAT 3 DOT MENU
// =========================

const chatMenuBtn = document.getElementById("chatMenuBtn");
const chatMenu = document.getElementById("chatMenu");
const chatSettingsMenuBtn = document.getElementById("chatSettingsMenuBtn");


if(chatMenuBtn && chatMenu){

    chatMenuBtn.onclick = (e)=>{

        e.stopPropagation();

        chatMenu.classList.toggle("show");

    };

}


if(chatSettingsMenuBtn){

    chatSettingsMenuBtn.onclick = ()=>{

        window.location.href = "chat-settings.html";

    };

}


document.addEventListener("click",(e)=>{

    if(
        chatMenu &&
        !chatMenu.contains(e.target) &&
        !chatMenuBtn.contains(e.target)
    ){

        chatMenu.classList.remove("show");

    }

});
