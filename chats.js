import { auth } from "./firebase.js";

const chatList = document.getElementById("chatList");

auth.onAuthStateChanged((user) => {

    if (!user) {
        location.href = "login.html";
        return;
    }

    chatList.innerHTML = `
        <div style="padding:20px;text-align:center;">
            Loading chats...
        </div>
    `;

});
