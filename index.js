const profiles = [

  {
    name:"Sophia",
    age:24,
    city:"Tripoli",

    image:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800",

    video:
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",

    bio:
    "Loves fashion, travelling and live video chats."
  },



  {
    name:"Daniel",
    age:27,
    city:"Benghazi",

    image:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800",

    video:
    "https://www.youtube.com/watch?v=ysz5S6PUM-U",

    bio:
    "Entrepreneur, fitness lover and content creator."
  },



  {
    name:"Amara",
    age:22,
    city:"Misrata",

    image:
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800",

    video:
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",

    bio:
    "Music lover, dancer and social media influencer."
  },



  {
    name:"Michael",
    age:29,
    city:"Abuja",

    image:
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800",

    video:
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ",

    bio:
    "Friendly guy who enjoys football and adventure."
  }

];



const profilesContainer =
document.getElementById("profiles");



/* LOAD PROFILES */

function loadProfiles(){

  profilesContainer.innerHTML = "";



  profiles.forEach(profile => {

    profilesContainer.innerHTML += `

    <div class="profile-item">

      <img
      src="${profile.image}"
      alt="${profile.name}">


      <div class="profile-content">

        <h3>

          ${profile.name},
          ${profile.age}

        </h3>


        <p>

          📍 ${profile.city}

        </p>


        <p>

          ${profile.bio}

        </p>



        <div class="profile-buttons">

          <a
          href="${profile.image}"
          target="_blank"
          class="photo-btn">

            View Photo

          </a>



          <a
          href="${profile.video}"
          target="_blank"
          class="video-btn">

            Watch Video

          </a>

        </div>

      </div>

    </div>

    `;

  });

}



/* SEARCH FUNCTION */

const searchInput =
document.querySelector(".search-box input");



searchInput.addEventListener("keyup", () => {

  const value =
  searchInput.value.toLowerCase();

  const allProfiles =
  document.querySelectorAll(".profile-item");



  allProfiles.forEach(card => {

    const text =
    card.innerText.toLowerCase();



    if(text.includes(value)){

      card.style.display = "block";

    }

    else{

      card.style.display = "none";

    }

  });

});



/* MENU BUTTON */

const menuBtn =
document.querySelector(".menu-btn");



menuBtn.addEventListener("click", () => {

  document.body.classList.toggle("menu-open");

});



/* START BUTTON */

const startButton =
document.querySelector(".overlay button");



startButton.addEventListener("click", () => {

  alert(
    "Welcome to MatchConnect!"
  );

});



/* LOAD WEBSITE */

loadProfiles();
