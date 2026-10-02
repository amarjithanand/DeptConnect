import {
    getAuth,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",

    authDomain:
        "deptconnect-8b81c.firebaseapp.com",

    projectId:
        "deptconnect-8b81c",

    storageBucket:
        "deptconnect-8b81c.firebasestorage.app",

    messagingSenderId:
        "916956737819",

    appId:
        "1:916956737819:web:8fc9920e834ac99e66e3be",

    measurementId:
        "G-2B4VN12YW5"

};


/* =========================================
   INITIALIZE FIREBASE
========================================= */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);


/* =========================================
   BACK TO LOGIN
========================================= */

document
    .getElementById("backToLogin")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "login.html";

        }
    );


/* =========================================
   SIGN OUT
========================================= */

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Sign out error:",
                    error
                );

            }

        }
    );