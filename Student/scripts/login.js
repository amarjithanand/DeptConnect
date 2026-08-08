/* =========================================
   FIREBASE IMPORTS
========================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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

const db = getFirestore(app);


/* =========================================
   DOM ELEMENTS
========================================= */

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const rememberMe =
    document.getElementById("rememberMe");

const signinButton =
    document.getElementById("signinButton");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");

const loginError =
    document.getElementById("loginError");

const emailError =
    document.getElementById("emailError");

const passwordError =
    document.getElementById("passwordError");

const forgotPassword =
    document.getElementById("forgotPassword");


/* =========================================
   SHOW ERROR
========================================= */

function showLoginError(message) {

    loginError.textContent = message;

    loginError.classList.add("show");

}


/* =========================================
   CLEAR ERRORS
========================================= */

function clearErrors() {

    loginError.textContent = "";

    loginError.classList.remove("show");

    emailError.textContent = "";

    passwordError.textContent = "";

}


/* =========================================
   LOADING STATE
========================================= */

function setLoading(isLoading) {

    signinButton.disabled = isLoading;

    if (isLoading) {

        buttonText.textContent =
            "Signing In...";

        loader.style.display =
            "inline-block";

    } else {

        buttonText.textContent =
            "Sign In";

        loader.style.display =
            "none";

    }

}


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearErrors();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        /* =============================
           BASIC VALIDATION
        ============================= */

        if (!email) {

            emailError.textContent =
                "Please enter your email.";

            return;

        }


        if (!password) {

            passwordError.textContent =
                "Please enter your password.";

            return;

        }


        setLoading(true);


        try {

            /* =============================
               STEP 1
               AUTH PERSISTENCE
            ============================= */

            await setPersistence(
                auth,
                rememberMe.checked
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );


            /* =============================
               STEP 2
               FIREBASE AUTHENTICATION
            ============================= */

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "STEP 1: Authentication successful"
            );

            console.log(
                "Authenticated UID:",
                user.uid
            );


            /* =============================
               STEP 3
               FIND USER ROLE
               
               IMPORTANT:
               We search the `uid` FIELD
               instead of using the document ID.
            ============================= */

            console.log(
                "STEP 2: Checking role..."
            );


            const roleQuery = query(
                collection(db, "role"),
                where(
                    "uid",
                    "==",
                    user.uid
                )
            );


            const roleSnapshot =
                await getDocs(roleQuery);


            console.log(
                "STEP 3: Role lookup completed"
            );

            console.log(
                "Role documents found:",
                roleSnapshot.size
            );


            /* =============================
               ROLE NOT FOUND
            ============================= */

            if (roleSnapshot.empty) {

                await auth.signOut();

                showLoginError(
                    "Your account does not have a registered role."
                );

                setLoading(false);

                return;

            }


            /* =============================
               GET ROLE DATA
            ============================= */

            const roleData =
                roleSnapshot.docs[0].data();


            console.log(
                "Role data:",
                roleData
            );


            /* =============================
               VERIFY STUDENT ROLE
            ============================= */

            if (
                roleData.role !==
                "student"
            ) {

                await auth.signOut();

                showLoginError(
                    "This account is not registered as a student."
                );

                setLoading(false);

                return;

            }


            console.log(
                "Student role verified."
            );


            /* =============================
               STEP 4
               FIND STUDENT PROFILE
               
               IMPORTANT:
               We search the `uid` FIELD.
            ============================= */

            console.log(
                "STEP 4: Checking student profile..."
            );


            const studentQuery = query(
                collection(db, "students"),
                where(
                    "uid",
                    "==",
                    user.uid
                )
            );


            const studentSnapshot =
                await getDocs(studentQuery);


            console.log(
                "STEP 5: Student lookup completed"
            );

            console.log(
                "Student documents found:",
                studentSnapshot.size
            );


            /* =============================
               STUDENT NOT FOUND
            ============================= */

            if (
                studentSnapshot.empty
            ) {

                await auth.signOut();

                showLoginError(
                    "Student profile was not found."
                );

                setLoading(false);

                return;

            }


            /* =============================
               GET STUDENT DATA
            ============================= */

            const studentDocument =
                studentSnapshot.docs[0];


            const studentData =
                studentDocument.data();


            console.log(
                "Student profile:",
                studentData
            );


            /* =============================
               STEP 6
               ACCOUNT STATUS
            ============================= */

            if (
                studentData.account_status !==
                true
            ) {

                await auth.signOut();

                showLoginError(
                    "Your account is currently inactive."
                );

                setLoading(false);

                return;

            }


            /* =============================
               STEP 7
               STUDENT STATUS
            ============================= */

            if (
                studentData.student_status !==
                true
            ) {

                await auth.signOut();

                showLoginError(
                    "Your student account is inactive."
                );

                setLoading(false);

                return;

            }


            /* =============================
               STEP 8
               STORE SESSION DATA
            ============================= */

            sessionStorage.setItem(
                "deptconnect_uid",
                user.uid
            );


            sessionStorage.setItem(
                "deptconnect_role",
                "student"
            );


            sessionStorage.setItem(
                "deptconnect_student_id",
                studentData.studentId
            );


            sessionStorage.setItem(
                "deptconnect_student_name",
                studentData.name
            );


            sessionStorage.setItem(
                "deptconnect_student_email",
                studentData.email
            );


            /* =============================
               STEP 9
               LOGIN SUCCESS
            ============================= */

            console.log(
                "STEP 6: Student verified successfully."
            );


            console.log(
                "Student:",
                studentData.name
            );


            console.log(
                "Redirecting to dashboard..."
            );


            buttonText.textContent =
                "Success!";


            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                500
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            handleFirebaseError(
                error
            );


            setLoading(false);

        }

    }
);


/* =========================================
   FIREBASE ERROR HANDLING
========================================= */

function handleFirebaseError(error) {

    switch (error.code) {

        case "auth/invalid-credential":

            showLoginError(
                "Invalid email or password."
            );

            break;


        case "auth/user-not-found":

            showLoginError(
                "No account exists with this email."
            );

            break;


        case "auth/wrong-password":

            showLoginError(
                "Incorrect password."
            );

            break;


        case "auth/invalid-email":

            emailError.textContent =
                "Please enter a valid email address.";

            break;


        case "auth/user-disabled":

            showLoginError(
                "This account has been disabled."
            );

            break;


        case "auth/too-many-requests":

            showLoginError(
                "Too many unsuccessful attempts. Please try again later."
            );

            break;


        case "auth/network-request-failed":

            showLoginError(
                "Network error. Please check your internet connection."
            );

            break;


        default:

            showLoginError(
                "Unable to sign in. Please try again."
            );

            console.error(
                error.code,
                error.message
            );

    }

}


/* =========================================
   FORGOT PASSWORD
========================================= */

forgotPassword.addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        clearErrors();

        const email =
            emailInput.value.trim();


        if (!email) {

            emailError.textContent =
                "Enter your email first.";

            emailInput.focus();

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            showLoginError(
                "Password reset email sent. Check your inbox."
            );


        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );


            handleFirebaseError(
                error
            );

        }

    }
);


/* =========================================
   CLEAR ERRORS WHEN TYPING
========================================= */

emailInput.addEventListener(
    "input",
    () => {

        emailError.textContent = "";

        loginError.textContent = "";

        loginError.classList.remove(
            "show"
        );

    }
);


passwordInput.addEventListener(
    "input",
    () => {

        passwordError.textContent = "";

        loginError.textContent = "";

        loginError.classList.remove(
            "show"
        );

    }
);