/* =========================================
   FIREBASE IMPORTS
========================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js";


/* =========================================
   FIREBASE CONFIGURATION
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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const functions = getFunctions(app);


/* =========================================
   DOM ELEMENTS
========================================= */

const form =
    document.getElementById("registerStudentForm");

const registerButton =
    document.getElementById("registerButton");

const buttonText =
    document.getElementById("buttonText");

const buttonLoader =
    document.getElementById("buttonLoader");

const cancelButton =
    document.getElementById("cancelButton");

const profileButton =
    document.getElementById("profileButton");

const profileMenu =
    document.getElementById("profileMenu");

const logoutButton =
    document.getElementById("logoutButton");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================
   TOAST
========================================= */

function showToast(message, success = true) {

    toastMessage.textContent = message;

    toast.style.background =
        success ? "#166534" : "#b91c1c";

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    console.log(
        "Authenticated faculty UID:",
        user.uid
    );

});


/* =========================================
   REGISTER STUDENT
========================================= */

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    /* -----------------------------------------
       GET FORM VALUES
    ----------------------------------------- */

    const name =
        document.getElementById("name")
            .value.trim();

    const email =
        document.getElementById("email")
            .value.trim();

    const password =
        document.getElementById("password")
            .value;

    const batch =
        document.getElementById("batch")
            .value.trim();

    const department =
        document.getElementById("department")
            .value.trim();

    const dob =
        document.getElementById("dob")
            .value;

    const gender =
        document.getElementById("gender")
            .value;

    const profileImg =
        document.getElementById("profileImg")
            .value.trim();

    const programme =
        document.getElementById("programme")
            .value.trim();

    const semester =
        Number(
            document.getElementById("semester")
                .value
        );

    const studentId =
        document.getElementById("studentId")
            .value.trim();

    const accountStatus =
        document.getElementById("accountStatus")
            .checked;

    const studentStatus =
        document.getElementById("studentStatus")
            .checked;


    /* -----------------------------------------
       BASIC VALIDATION
    ----------------------------------------- */

    if (!name ||
        !email ||
        !password ||
        !batch ||
        !department ||
        !dob ||
        !gender ||
        !programme ||
        !semester ||
        !studentId) {

        showToast(
            "Please fill all required fields.",
            false
        );

        return;
    }


    if (password.length < 6) {

        showToast(
            "Password must contain at least 6 characters.",
            false
        );

        return;
    }


    /* -----------------------------------------
       DISABLE BUTTON
    ----------------------------------------- */

    registerButton.disabled = true;

    buttonText.textContent =
        "Registering...";

    buttonLoader.hidden = false;


    try {

        /* -----------------------------------------
           CALL CLOUD FUNCTION
        ----------------------------------------- */

        const registerStudent =
            httpsCallable(
                functions,
                "registerStudent"
            );


        const result =
            await registerStudent({

                name,

                email,

                password,

                batch,

                account_status:
                    accountStatus,

                department,

                dob,

                gender,

                profileImg,

                programme,

                semester,

                studentId,

                student_status:
                    studentStatus

            });


        console.log(
            "Registration result:",
            result.data
        );


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        showToast(
            "Student registered successfully.",
            true
        );


        /* Reset form */

        form.reset();


        /* Restore defaults */

        document.getElementById(
            "accountStatus"
        ).checked = true;

        document.getElementById(
            "studentStatus"
        ).checked = true;


    } catch (error) {

        console.error(
            "Student registration error:",
            error
        );


        let message =
            "Unable to register student.";


        if (error.code ===
            "functions/already-exists") {

            message =
                "A student with this email or Student ID already exists.";

        } else if (
            error.code ===
            "functions/permission-denied"
        ) {

            message =
                "You are not authorized to register students.";

        } else if (
            error.code ===
            "functions/invalid-argument"
        ) {

            message =
                error.message ||
                "Invalid student information.";

        } else if (
            error.code ===
            "functions/unauthenticated"
        ) {

            message =
                "Your session has expired. Please login again.";

        } else if (
            error.message
        ) {

            message =
                error.message;
        }


        showToast(
            message,
            false
        );


    } finally {

        registerButton.disabled = false;

        buttonText.textContent =
            "Register Student";

        buttonLoader.hidden = true;

    }

});


/* =========================================
   CANCEL
========================================= */

cancelButton.addEventListener(
    "click",
    () => {

        form.reset();

        document.getElementById(
            "accountStatus"
        ).checked = true;

        document.getElementById(
            "studentStatus"
        ).checked = true;

    }
);


/* =========================================
   PROFILE MENU
========================================= */

profileButton.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        profileMenu.classList.toggle(
            "show"
        );

    }
);


document.addEventListener(
    "click",
    () => {

        profileMenu.classList.remove(
            "show"
        );

    }
);


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            sessionStorage.clear();

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            showToast(
                "Unable to logout.",
                false
            );

        }

    }
);