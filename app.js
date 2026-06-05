import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// CREATE USER FUNCTION
async function createUser() {
  try {
    const docRef = await addDoc(collection(window.db, "users"), {
      name: "Mira",
      age: 22,
      city: "Tripoli",
      bio: "Hello I’m new here",
      createdAt: new Date()
    });

    console.log("User created:", docRef.id);
  } catch (error) {
    console.error(error);
  }
}

// make function usable in HTML
window.createUser = createUser;
