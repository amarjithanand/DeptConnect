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


/*
 * IMPORTANT:
 * Explicitly use the same region as
 * the deployed Cloud Function.
 */

const functions =
    getFunctions(
        app,
        "us-central1"
    );


/* =========================================
   DOM ELEMENTS
========================================= */

const form =
    document.getElementById(
        "registerStudentForm"
    );

const registerButton =
    document.getElementById(
        "registerButton"
    );

const buttonText =
    document.getElementById(
        "buttonText"
    );

const buttonLoader =
    document.getElementById(
        "buttonLoader"
    );

const cancelButton =
    document.getElementById(
        "cancelButton"
    );

const profileButton =
    document.getElementById(
        "profileButton"
    );

const profileMenu =
    document.getElementById(
        "profileMenu"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const toast =
    document.getElementById(
        "toast"
    );

const toastMessage =
    document.getElementById(
        "toastMessage"
    );


/* =========================================
   CURRENT FACULTY
========================================= */

let currentFaculty = null;


/* =========================================
   TOAST
========================================= */

function showToast(
    message,
    success = true
) {

    toastMessage.textContent =
        message;

    toast.style.background =
        success
            ? "#166534"
            : "#b91c1c";

    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 4000);

}


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        currentFaculty =
            user;


        console.log(
            "Faculty authenticated:",
            user.uid
        );

    }
);


/* =========================================
   REGISTER STUDENT
========================================= */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /* -------------------------------------
           MAKE SURE FACULTY IS LOGGED IN
        ------------------------------------- */

        if (!auth.currentUser) {

            showToast(
                "Your session has expired. Please login again.",
                false
            );

            return;
        }


        /* -------------------------------------
           GET FORM VALUES
        ------------------------------------- */

        const name =
            document
                .getElementById("name")
                .value
                .trim();


        const email =
            document
                .getElementById("email")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("password")
                .value;


        const batch =
            document
                .getElementById("batch")
                .value
                .trim();


        const department =
            document
                .getElementById("department")
                .value
                .trim();


        const dob =
            document
                .getElementById("dob")
                .value;


        const gender =
            document
                .getElementById("gender")
                .value;


        const profileImg =
            document
                .getElementById("profileImg")
                .value
                .trim();


        const programme =
            document
                .getElementById("programme")
                .value
                .trim();


        const semester =
            Number(
                document
                    .getElementById("semester")
                    .value
            );


        const studentId =
            document
                .getElementById("studentId")
                .value
                .trim();


        const accountStatus =
            document
                .getElementById("accountStatus")
                .checked;


        const studentStatus =
            document
                .getElementById("studentStatus")
                .checked;


        /* -------------------------------------
           VALIDATION
        ------------------------------------- */

        if (
            !name ||
            !email ||
            !password ||
            !batch ||
            !department ||
            !dob ||
            !gender ||
            !programme ||
            !studentId
        ) {

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


        if (
            !Number.isInteger(semester) ||
            semester < 1 ||
            semester > 6
        ) {

            showToast(
                "Please select a valid semester.",
                false
            );

            return;
        }


        /* -------------------------------------
           DISABLE BUTTON
        ------------------------------------- */

        registerButton.disabled =
            true;

        buttonText.textContent =
            "Registering...";

        buttonLoader.hidden =
            false;


        try {

            /* ---------------------------------
               GET CALLABLE FUNCTION
            --------------------------------- */

            const registerStudent =
                httpsCallable(
                    functions,
                    "registerStudent"
                );


            /* ---------------------------------
               CALL BACKEND
            --------------------------------- */

            const result =
                await registerStudent({

                    name: name,

                    email: email,

                    password: password,

                    batch: batch,

                    account_status:
                        accountStatus,

                    department:
                        department,

                    dob: dob,

                    gender: gender,

                    profileImg:
                        profileImg,

                    programme:
                        programme,

                    semester:
                        semester,

                    studentId:
                        studentId,

                    student_status:
                        studentStatus

                });


            console.log(
                "Registration successful:",
                result.data
            );


            /* ---------------------------------
               SUCCESS
            --------------------------------- */

            showToast(
                "Student registered successfully.",
                true
            );


            /* Reset form */

            form.reset();


            /* Restore default switches */

            document
                .getElementById(
                    "accountStatus"
                )
                .checked = true;


            document
                .getElementById(
                    "studentStatus"
                )
                .checked = true;


        } catch (error) {

            console.error(
                "Student registration error:",
                error
            );


            /* -------------------------------
               ERROR MESSAGE
            -------------------------------- */

            let message =
                "Unable to register student.";


            if (
                error.code ===
                "functions/already-exists"
            ) {

                message =
                    error.message ||
                    "Email or Student ID already exists.";

            }

            else if (
                error.code ===
                "functions/permission-denied"
            ) {

                message =
                    "You are not authorized to register students.";

            }

            else if (
                error.code ===
                "functions/unauthenticated"
            ) {

                message =
                    "Your login session has expired.";

            }

            else if (
                error.code ===
                "functions/invalid-argument"
            ) {

                message =
                    error.message ||
                    "Invalid student information.";

            }

            else if (
                error.code ===
                "functions/internal"
            ) {

                message =
                    error.message ||
                    "A server error occurred while registering the student.";

            }

            else if (
                error.message
            ) {

                message =
                    error.message;

            }


            showToast(
                message,
                false
            );

        }


        finally {

            registerButton.disabled =
                false;

            buttonText.textContent =
                "Register Student";

            buttonLoader.hidden =
                true;

        }

    }
);


/* =========================================
   CANCEL BUTTON
========================================= */

cancelButton.addEventListener(
    "click",
    () => {

        form.reset();


        document
            .getElementById(
                "accountStatus"
            )
            .checked = true;


        document
            .getElementById(
                "studentStatus"
            )
            .checked = true;

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