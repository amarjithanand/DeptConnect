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

    apiKey: "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",

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
    document.getElementById("registerForm");

const registerButton =
    document.getElementById("registerButton");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================
   SHOW TOAST MESSAGE
========================================= */

function showToast(message, success = false) {

    if (!toast || !toastMessage) {
        alert(message);
        return;
    }

    toastMessage.textContent = message;

    toast.style.background =
        success
            ? "#166534"
            : "#b91c1c";

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 4500);

}


/* =========================================
   LOADING STATE
========================================= */

function setLoading(loading) {

    if (registerButton) {
        registerButton.disabled = loading;
    }

    if (loader) {
        loader.hidden = !loading;
    }

    if (buttonText) {

        buttonText.textContent =
            loading
                ? "Submitting..."
                : "Submit Registration";

    }

}


/* =========================================
   FORM SUBMISSION
========================================= */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /* =====================================
           GET FORM VALUES
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
                "Please fill in all required fields."
            );

            return;
        }


        if (password.length < 6) {

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
           VALIDATE DATE
        ===================================== */

        const dobDate =
            new Date(
                `${dob}T00:00:00`
            );


        if (
            Number.isNaN(
                dobDate.getTime()
            )
        ) {

            showToast(
                "Please select a valid date of birth."
            );

            return;
        }


        /* =====================================
           START LOADING
        ===================================== */

        setLoading(true);


        try {


            /* =================================
               STEP 1
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


            /*
             * Firebase automatically generates
             * the UID.
             */

            const uid =
                user.uid;


            console.log(
                "Student Firebase UID:",
                uid
            );


            /* =================================
               STEP 2
               UPDATE AUTH PROFILE
            ================================= */

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            /* =================================
               STEP 3
               CONVERT DOB TO FIRESTORE TIMESTAMP
            ================================= */

            const dobTimestamp =
                Timestamp.fromDate(
                    dobDate
                );


            /* =================================
               STEP 4
               CREATE STUDENT DATA
            ================================= */

            const studentData = {

                /* -----------------------------
                   PERSONAL INFORMATION
                ----------------------------- */

                name:
                    name,

                email:
                    email,

                gender:
                    gender,

                dob:
                    dobTimestamp,

                profileImg:
                    profileImg,


                /* -----------------------------
                   ACADEMIC INFORMATION
                ----------------------------- */

                studentId:
                    studentId,

                department:
                    department,

                programme:
                    programme,

                semester:
                    semester,

                batch:
                    batch,


                /* -----------------------------
                   FIREBASE UID
                ----------------------------- */

                uid:
                    uid,


                /* -----------------------------
                   ACCOUNT STATUS
                ----------------------------- */

                account_status:
                    false,

                student_status:
                    false,

                isApproved:
                    false,


                /* -----------------------------
                   CREATED TIME
                ----------------------------- */

                createdAt:
                    serverTimestamp()

            };


            /* =================================
               STEP 5
               SAVE TO FIRESTORE
            ================================= */

            await setDoc(
                doc(
                    db,
                    "students",
                    uid
                ),
                studentData
            );


            console.log(
                "Student document created successfully."
            );


            /* =================================
               SUCCESS MESSAGE
            ================================= */

            showToast(
                "Registration submitted successfully. Waiting for faculty approval.",
                true
            );


            /* =================================
               STEP 6
               REDIRECT TO PENDING PAGE
            ================================= */

            setTimeout(() => {

                window.location.href =
                    "registration-pending.html";

            }, 1800);


        } catch (error) {

            console.error(
                "Registration Error:",
                error
            );


            /* =================================
               ERROR HANDLING
            ================================= */

            let message =
                "Registration failed. Please try again.";


            switch (error.code) {


                case "auth/email-already-in-use":

                    message =
                        "An account with this email already exists.";

                    break;


                case "auth/invalid-email":

                    message =
                        "Please enter a valid email address.";

                    break;


                case "auth/weak-password":

                    message =
                        "Password must contain at least 6 characters.";

                    break;


                case "auth/network-request-failed":

                    message =
                        "Network error. Please check your internet connection.";

                    break;


                case "auth/operation-not-allowed":

                    message =
                        "Email/password authentication is not enabled in Firebase.";

                    break;


                case "permission-denied":

                    message =
                        "You do not have permission to create the student profile.";

                    break;


                default:

                    if (
                        error.message &&
                        error.message.includes(
                            "Missing or insufficient permissions"
                        )
                    ) {

                        message =
                            "Firestore permission denied. Please check your security rules.";

                    }

                    break;

            }


            showToast(message);


        } finally {

            setLoading(false);

        }

    }
);