import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyCVdy9nJLp3YDV9PNB9kfR3HiQCdFdvGmg",
  authDomain: "matchconnect-44a3e.firebaseapp.com",
  projectId: "matchconnect-44a3e",
  storageBucket: "matchconnect-44a3e.firebasestorage.app",
  messagingSenderId: "283382943870",
  appId: "1:283382943870:web:ee1d08c65bcbac400cc82f"
};


const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

const auth =
  getAuth(app);


// Get UID from URL
const params =
  new URLSearchParams(
    window.location.search
  );

const uid =
  params.get("uid");


if (!uid) {
  alert("No UID received");
  throw new Error("UID missing");
}


const container =
  document.getElementById(
    "followingList"
  );

const totalEl =
  document.getElementById(
    "followingTotal"
  );


if (!container || !totalEl) {
  throw new Error("Required elements missing");
}



onAuthStateChanged(auth, async (user) => {


  if (!user) {

    window.location.href = "login.html";
    return;

  }



  container.innerHTML = "";



  try {


    const followingSnapshot =
      await getDocs(
        collection(
          db,
          "users",
          uid,
          "following"
        )
      );



    totalEl.textContent =
      followingSnapshot.size;



    if (followingSnapshot.empty) {


      container.innerHTML =
        "Not following anyone yet";


      return;

    }



    for (const followingDoc of followingSnapshot.docs) {


      const followingId =
        followingDoc.data().userId ||
        followingDoc.id;



      const userSnap =
        await getDoc(
          doc(
            db,
            "users",
            followingId
          )
        );



      if (userSnap.exists()) {


        const userData =
          userSnap.data();



        const div =
          document.createElement("div");



        div.innerHTML = `

          <div class="user-card">


            <img
              src="${userData.photoURL || "images/default-avatar.png"}"
              width="50"
              height="50"
            >


            <a href="user.html?uid=${followingId}">
              ${userData.name || "User"}
            </a>


          </div>

        `;



        container.appendChild(div);


      } else {


        console.log(
          "User not found:",
          followingId
        );


      }


    }



  } catch(error) {


    console.error(
      "Following error:",
      error
    );


    container.innerHTML =
      error.message;


  }


});
