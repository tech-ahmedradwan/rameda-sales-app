import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyAxlWe8HftfYeQvmE2W8TyXJapp5qERa4E",
  authDomain: "rameda-sales.firebaseapp.com",
  projectId: "rameda-sales"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* 🔐 LOGIN HANDLER */
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMessage");
  const btn = document.getElementById("loginBtn");
  const btnText = btn.querySelector(".btn-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msg.textContent = "";
    msg.className = "login-message";

    btn.classList.add("loading");
    btnText.textContent = "Signing in...";

    try {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      /* 1️⃣ AUTH */
      const cred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      /* 2️⃣ GET ROLE */
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "users", uid));

      if (!snap.exists()) {
        await signOut(auth);
        throw new Error("User not registered");
      }

      const { role } = snap.data();

      msg.classList.add("success");
      msg.textContent = "Login successful";

      /* 3️⃣ ROLE REDIRECT */
      setTimeout(() => {
        location.href =
          role === "admin"
            ? "admin.html"
            : "dashboard.html";
      }, 800);

    } catch (err) {
      msg.classList.add("error");
      msg.textContent = err.message;
    } finally {
      btn.classList.remove("loading");
      btnText.textContent = "Login";
    }
  });
});
