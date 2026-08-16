import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase config (YOUR REAL DATA)
const firebaseConfig = {
  apiKey: "AIzaSyCVdy9nJLp3YDV9PNB9kfR3HiQCdFdvGmg",
  authDomain: "matchconnect-44a3e.firebaseapp.com",
  projectId: "matchconnect-44a3e",
  storageBucket: "matchconnect-44a3e.firebasestorage.app",
  messagingSenderId: "283382943870",
  appId: "1:283382943870:web:ee1d08c65bcbac400cc82f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// REGISTER BUTTON
document.getElementById("registerBtn").addEventListener("click", async () => {

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  if (!name) {
  alert("Please enter a username");
  return;
  }

  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Save user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username: name,
      bio: "",
      photoURL: "",
      createdAt: new Date()
    });

    console.log("User profile saved successfully");

// 3. Create MatchConnect wallet automatically
const walletId =
  "MC-" +
  Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

await setDoc(doc(db, "wallets", user.uid), {

  userId: user.uid,

  walletId: walletId,

  balanceMCC: 0,

  defaultCurrency: "MCC",

  createdAt: new Date()

});

console.log(
  "Wallet created successfully:",
  walletId
);

// Send verification email
await sendEmailVerification(user);

alert("Account created successfully! Please check your Gmail and verify your email.");

window.location.href = "verify-email.html";

  } catch (error) {
    alert(error.message);
  }
});
