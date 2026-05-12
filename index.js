const profiles = [
  {
    name: "Sophia",
    age: 24,
    city: "Tripoli",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },

  {
    name: "Daniel",
    age: 27,
    city: "Benghazi",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800",
    video: "https://www.youtube.com/watch?v=ysz5S6PUM-U"
  },

  {
    name: "Amara",
    age: 22,
    city: "Misrata",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=800",
    video: "https://www.youtube.com/watch?v=jNQXAC9IVRw"
  }
];

const profilesContainer = document.getElementById("profiles");

profiles.forEach(profile => {

  profilesContainer.innerHTML += `
  
    <div class="profile-card">

      <img src="${profile.image}" alt="${profile.name}">

      <div class="profile-content">

        <h3>${profile.name}, ${profile.age}</h3>

        <p>📍 ${profile.city}</p>

        <div class="profile-buttons">

          <a href="${profile.image}" target="_blank" class="photo-btn">
            View Photo
          </a>

          <a href="${profile.video}" target="_blank" class="video-btn">
            Watch Video
          </a>

        </div>

      </div>

    </div>

  `;
});
