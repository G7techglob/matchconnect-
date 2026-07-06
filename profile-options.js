const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

menuBtn.onclick = () => {
    menu.classList.toggle("show");
};

window.onclick = (e) => {
    if(!e.target.closest(".menu-btn") &&
       !e.target.closest(".menu")){
        menu.classList.remove("show");
    }
};

document.getElementById("shareBtn").onclick = () => {
    alert("Share Profile");
};

document.getElementById("blockBtn").onclick = () => {

    const confirmBlock = confirm("Block this user?");

    if(confirmBlock){
        alert("User Blocked");
    }

};

document.getElementById("reportBtn").onclick = () => {

    const reason = prompt(
        "Why are you reporting this user?"
    );

    if(reason){
        alert("Report Submitted");
    }

};
