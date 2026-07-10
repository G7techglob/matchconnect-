import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// Get elements
const readReceipts = document.getElementById("readReceipts");
const typingIndicator = document.getElementById("typingIndicator");
const onlineStatus = document.getElementById("onlineStatus");
const messagePreview = document.getElementById("messagePreview");
const autoDownload = document.getElementById("autoDownload");
const saveBtn = document.getElementById("saveBtn");


let currentUser;


// Load saved settings
onAuthStateChanged(auth, async (user)=>{

    if(!user){
        location.href = "login.html";
        return;
    }

    currentUser = user;

    const settingsRef = doc(
        db,
        "users",
        user.uid,
        "settings",
        "chat"
    );


    const snap = await getDoc(settingsRef);


    if(snap.exists()){

        const data = snap.data();

        readReceipts.checked = data.readReceipts ?? true;
        typingIndicator.checked = data.typingIndicator ?? true;
        onlineStatus.checked = data.onlineStatus ?? true;
        messagePreview.checked = data.messagePreview ?? true;
        autoDownload.checked = data.autoDownload ?? true;

    }else{

        // Default values
        readReceipts.checked = true;
        typingIndicator.checked = true;
        onlineStatus.checked = true;
        messagePreview.checked = true;
        autoDownload.checked = true;

    }

});


// Save settings
saveBtn.onclick = async()=>{

    if(!currentUser) return;


    const settingsRef = doc(
        db,
        "users",
        currentUser.uid,
        "settings",
        "chat"
    );


    await setDoc(settingsRef,{

        readReceipts: readReceipts.checked,

        typingIndicator: typingIndicator.checked,

        onlineStatus: onlineStatus.checked,

        messagePreview: messagePreview.checked,

        autoDownload: autoDownload.checked

    });


    alert("Chat settings saved ✅");

};
