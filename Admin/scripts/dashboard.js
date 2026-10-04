import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ==========================================
// Firebase Configuration
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",
    authDomain: "deptconnect-8b81c.firebaseapp.com",
    projectId: "deptconnect-8b81c",
    storageBucket: "deptconnect-8b81c.firebasestorage.app",
    messagingSenderId: "916956737819",
    appId: "1:916956737819:web:8fc9920e834ac99e66e3be",
    measurementId: "G-2B4VN12YW5"
};


// ==========================================
// Initialize Firebase
// ==========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ==========================================
// DOM Elements
// ==========================================

const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");


// ==========================================
// ADMIN AUTHENTICATION PROTECTION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    // No authenticated user
    if (!user) {

        window.location.href = "login.html";

        return;
    }


    try {

        // Find role document for current user

        const roleQuery = query(
            collection(db, "role"),
            where("uid", "==", user.uid)
        );

        const roleSnapshot = await getDocs(roleQuery);


        // No role document

        if (roleSnapshot.empty) {

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }


        // Check admin role

        let isAdmin = false;

        roleSnapshot.forEach((doc) => {

            const roleData = doc.data();

            if (roleData.role === "admin") {
                isAdmin = true;
            }

        });


        // Not admin

        if (!isAdmin) {

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }


        // ======================================
        // ADMIN VERIFIED
        // ======================================

        console.log("Admin access verified.");

        adminEmail.textContent = user.email;


        // Load dashboard statistics

        await loadDashboardStatistics();

    }

    catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        await signOut(auth);

        window.location.href = "login.html";

    }

});


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

async function loadDashboardStatistics() {

    try {

        // --------------------------------------
        // Students
        // --------------------------------------

        const studentsSnapshot =
            await getDocs(
                collection(db, "students")
            );

        document.getElementById("totalStudents")
            .textContent =
            studentsSnapshot.size;


        // --------------------------------------
        // Faculty
        // --------------------------------------

        const facultySnapshot =
            await getDocs(
                collection(db, "faculty")
            );

        document.getElementById("totalFaculty")
            .textContent =
            facultySnapshot.size;


        // --------------------------------------
        // Queries
        // --------------------------------------

        const queriesSnapshot =
            await getDocs(
                collection(db, "queries")
            );

        document.getElementById("totalQueries")
            .textContent =
            queriesSnapshot.size;


        // --------------------------------------
        // Query Status Counts
        // --------------------------------------

        let pending = 0;
        let resolved = 0;
        let aiProcessed = 0;


        queriesSnapshot.forEach((doc) => {

            const data = doc.data();


            if (data.status === "pending") {
                pending++;
            }


            if (data.status === "resolved") {
                resolved++;
            }


            if (data.aiProcessed === true) {
                aiProcessed++;
            }

        });


        document.getElementById("pendingQueries")
            .textContent = pending;

        document.getElementById("resolvedQueries")
            .textContent = resolved;

        document.getElementById("aiProcessed")
            .textContent = aiProcessed;

    }

    catch (error) {

        console.error(
            "Error loading dashboard statistics:",
            error
        );

    }

}


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "login.html";

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

});