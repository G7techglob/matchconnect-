// Get form fields
const fullName = document.getElementById("fullName");
const username = document.getElementById("username");
const bio = document.getElementById("bio");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const country = document.getElementById("country");
const city = document.getElementById("city");

const saveBtn = document.getElementById("saveProfile");

// Load saved profile
window.addEventListener("load", () => {

    fullName.value = localStorage.getItem("fullName") || "";
    username.value = localStorage.getItem("username") || "";
    bio.value = localStorage.getItem("bio") || "";
    email.value = localStorage.getItem("email") || "";
    phone.value = localStorage.getItem("phone") || "";
    country.value = localStorage.getItem("country") || "";
    city.value = localStorage.getItem("city") || "";

});

// Save profile
saveBtn.addEventListener("click", () => {

    localStorage.setItem("fullName", fullName.value);
    localStorage.setItem("username", username.value);
    localStorage.setItem("bio", bio.value);
    localStorage.setItem("email", email.value);
    localStorage.setItem("phone", phone.value);
    localStorage.setItem("country", country.value);
    localStorage.setItem("city", city.value);

    alert("Profile updated successfully!");

    window.location.href = "profile.html";

});

window.addEventListener("load", () => {
    document.getElementById("profileName").innerText =
        localStorage.getItem("fullName") || "No name";

    document.getElementById("profileEmail").innerText =
        localStorage.getItem("email") || "No email";

    document.getElementById("profileBio").innerText =
        localStorage.getItem("bio") || "No bio yet";
});
