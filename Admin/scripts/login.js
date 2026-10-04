import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ===============================
// Firebase Configuration
// ===============================

const firebaseConfig = {
    apiKey: "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",
    authDomain: "deptconnect-8b81c.firebaseapp.com",
    projectId: "deptconnect-8b81c",
    storageBucket: "deptconnect-8b81c.firebasestorage.app",
    messagingSenderId: "916956737819",
    appId: "1:916956737819:web:8fc9920e834ac99e66e3be",
    measurementId: "G-2B4VN12YW5"
};


// ===============================
// Initialize Firebase
// ===============================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ===============================
// DOM Elements
// ===============================

const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const errorMessage = document.getElementById("errorMessage");


// ===============================
// Admin Login
// ===============================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    errorMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        errorMessage.textContent = "Please enter email and password.";
        return;
    }

    try {

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";


        // --------------------------------
        // Step 1: Firebase Authentication
        // --------------------------------

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        console.log("Authenticated UID:", user.uid);


        // --------------------------------
        // Step 2: Check Role Collection
        // --------------------------------

        const roleQuery = query(
            collection(db, "role"),
            where("uid", "==", user.uid)
        );

        const roleSnapshot = await getDocs(roleQuery);


        // No role document
        if (roleSnapshot.empty) {

            await signOut(auth);

            errorMessage.textContent =
                "Access denied. Admin role not found.";

            loginBtn.disabled = false;
            loginBtn.textContent = "Login";

            return;
        }


        // --------------------------------
        // Step 3: Verify Admin Role
        // --------------------------------

        let isAdmin = false;

        roleSnapshot.forEach((doc) => {

            const roleData = doc.data();

            console.log("Role data:", roleData);

            if (roleData.role === "admin") {
                isAdmin = true;
            }

        });


        // --------------------------------
        // Step 4: Reject Non-Admin Users
        // --------------------------------

        if (!isAdmin) {

            await signOut(auth);

            errorMessage.textContent =
                "Access denied. Admin privileges required.";

            loginBtn.disabled = false;
            loginBtn.textContent = "Login";

            return;
        }


        // --------------------------------
        // Step 5: Admin Login Successful
        // --------------------------------

        console.log("Admin authentication successful.");

        window.location.href = "dashboard.html";

    }

    catch (error) {

        console.error("Admin login error:", error);

        let message = "Login failed. Please try again.";

        if (error.code === "auth/invalid-credential") {
            message = "Invalid email or password.";
        }

        else if (error.code === "auth/user-not-found") {
            message = "Admin account not found.";
        }

        else if (error.code === "auth/wrong-password") {
            message = "Incorrect password.";
        }

        else if (error.code === "auth/too-many-requests") {
            message =
                "Too many login attempts. Please try again later.";
        }

        errorMessage.textContent = message;

        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }

});