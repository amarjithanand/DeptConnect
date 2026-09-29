/* =========================================
   FIREBASE IMPORTS
========================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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


const db =
    getFirestore(app);


/* =========================================
   DOM ELEMENTS
========================================= */

const form =
    document.getElementById(
        "registerForm"
    );


const registerButton =
    document.getElementById(
        "registerButton"
    );


const buttonText =
    document.getElementById(
        "buttonText"
    );


const loader =
    document.getElementById(
        "loader"
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
   TOAST
========================================= */

function showToast(
    message,
    success = false
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

    }, 4500);

}


/* =========================================
   SET LOADING STATE
========================================= */

function setLoading(
    loading
) {

    registerButton.disabled =
        loading;


    loader.hidden =
        !loading;


    buttonText.textContent =
        loading
            ? "Submitting..."
            : "Submit Registration";

}


/* =========================================
   FORM SUBMISSION
========================================= */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /* =====================================
           GET VALUES
        ===================================== */

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


        /* =====================================
           VALIDATION
        ===================================== */

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
                "Please fill all required fields."
            );

            return;
        }


        if (
            password.length < 6
        ) {

            showToast(
                "Password must contain at least 6 characters."
            );

            return;
        }


        if (
            !Number.isInteger(semester) ||
            semester < 1 ||
            semester > 6
        ) {

            showToast(
                "Please select a valid semester."
            );

            return;
        }


        /* =====================================
           LOADING
        ===================================== */

        setLoading(true);


        try {


            /* =================================
               CREATE FIREBASE AUTH ACCOUNT
            ================================= */

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            const uid =
                user.uid;


            console.log(
                "New student UID:",
                uid
            );


            /* =================================
               UPDATE AUTH DISPLAY NAME
            ================================= */

            await updateProfile(
                user,
                {
                    displayName:
                        name
                }
            );


            /* =================================
               CREATE DATE
            ================================= */

            const dobTimestamp =
                Timestamp.fromDate(
                    new Date(
                        `${dob}T00:00:00`
                    )
                );


            /* =================================
               STUDENT DOCUMENT
            ================================= */

            const studentData = {

                name:
                    name,

                email:
                    email,

                batch:
                    batch,

                account_status:
                    false,

                createdAt:
                    serverTimestamp(),

                department:
                    department,

                dob:
                    dobTimestamp,

                gender:
                    gender,

                profileImg:
                    profileImg,

                programme:
                    programme,

                semester:
                    semester,

                studentId:
                    studentId,

                student_status:
                    false,

                uid:
                    uid,

                registration_status:
                    "pending"

            };


            /* =================================
               SAVE STUDENT
            ================================= */

            await setDoc(
                doc(
                    db,
                    "students",
                    uid
                ),
                studentData
            );


            /* =================================
               SUCCESS
            ================================= */

            console.log(
                "Student registration saved."
            );


            showToast(
                "Registration submitted successfully. Waiting for faculty approval.",
                true
            );


            /* =================================
               REDIRECT
            ================================= */

            setTimeout(() => {

                window.location.href =
                    "registration-pending.html";

            }, 1800);


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            let message =
                "Registration failed. Please try again.";


            switch (
                error.code
            ) {


                case
                    "auth/email-already-in-use":

                    message =
                        "An account with this email already exists.";

                    break;


                case
                    "auth/invalid-email":

                    message =
                        "Please enter a valid email address.";

                    break;


                case
                    "auth/weak-password":

                    message =
                        "Password is too weak. Use at least 6 characters.";

                    break;


                case
                    "auth/network-request-failed":

                    message =
                        "Network error. Please check your internet connection.";

                    break;


                case
                    "permission-denied":

                    message =
                        "You are not permitted to create this registration.";

                    break;


                default:

                    if (
                        error.message
                    ) {

                        console.error(
                            error.message
                        );

                    }

                    break;

            }


            showToast(
                message
            );


        } finally {

            setLoading(false);

        }

    }
);