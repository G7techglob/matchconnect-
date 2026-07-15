import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

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

const params =
  new URLSearchParams(
    window.location.search
  );

const uid =
  params.get("uid");

const container =
  document.getElementById(
    "followingList"
  );

container.innerHTML = "";

const followingSnapshot =
  await getDocs(
    collection(
      db,
      "users",
      uid,
      "following"
    )
  );

document.getElementById(
  "followingTotal"
).textContent =
  followingSnapshot.size;

if (
  followingSnapshot.empty
) {

  container.innerHTML =
    "Not following anyone yet";
} else {

  const followingPromises =
    followingSnapshot.docs.map(
      async (followingDoc) => {

        const followingId =
          followingDoc.id;


        const userDoc =
          await getDoc(
            doc(
              db,
              "users",
              followingId
            )
          );


        if(userDoc.exists()){

          const userData =
            userDoc.data();


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

        }

      }
    );


  await Promise.all(followingPromises);

            }
