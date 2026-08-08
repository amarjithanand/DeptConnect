import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
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
        "facultyLoginForm"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const rememberMe =
    document.getElementById(
        "rememberMe"
    );

const signinButton =
    document.getElementById(
        "signinButton"
    );

const buttonText =
    document.getElementById(
        "buttonText"
    );

const loader =
    document.getElementById(
        "loader"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );


/* =========================================
   LOGIN
========================================= */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        clearErrors();


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        const password =
            passwordInput.value;


        /* =====================================
           VALIDATION
        ===================================== */

        if (!email) {

            showError(
                "emailError",
                "Please enter your institutional email."
            );

            return;

        }


        if (!password) {

            showError(
                "passwordError",
                "Please enter your password."
            );

            return;

        }


        setLoading(true);


        try {

            /* =================================
               1. FIREBASE AUTHENTICATION
            ================================= */

            await setPersistence(
                auth,
                rememberMe.checked
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );


            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                credential.user;


            console.log(
                "Authenticated UID:",
                user.uid
            );


            /* =================================
               2. FIND FACULTY ROLE
               
               Your structure:
               
               role
               └── randomDocumentId
                    ├── uid
                    └── role
            ================================= */

            console.log(
                "Checking faculty role..."
            );


            const roleQuery =
                query(
                    collection(
                        db,
                        "role"
                    ),
                    where(
                        "uid",
                        "==",
                        user.uid
                    )
                );


            const roleSnapshot =
                await getDocs(
                    roleQuery
                );


            console.log(
                "Role documents found:",
                roleSnapshot.size
            );


            if (
                roleSnapshot.empty
            ) {

                await signOut(auth);

                throw new Error(
                    "No role document found for this account."
                );

            }


            const roleData =
                roleSnapshot
                    .docs[0]
                    .data();


            console.log(
                "Role:",
                roleData.role
            );


            /* =================================
               3. VERIFY FACULTY ROLE
            ================================= */

            if (
                roleData.role !==
                "faculty"
            ) {

                await signOut(auth);

                throw new Error(
                    "This account is not authorized as faculty."
                );

            }


            /* =================================
               4. FIND FACULTY PROFILE
               
               Your structure:
               
               faculty
               └── randomDocumentId
                    ├── uid
                    ├── facultyId
                    ├── name
                    ├── email
                    ├── department
                    ├── designation
                    ├── subjects[]
                    └── ...
            ================================= */

            console.log(
                "Loading faculty profile..."
            );


            const facultyQuery =
                query(
                    collection(
                        db,
                        "faculty"
                    ),
                    where(
                        "uid",
                        "==",
                        user.uid
                    )
                );


            const facultySnapshot =
                await getDocs(
                    facultyQuery
                );


            console.log(
                "Faculty documents found:",
                facultySnapshot.size
            );


            if (
                facultySnapshot.empty
            ) {

                await signOut(auth);

                throw new Error(
                    "Faculty profile does not exist."
                );

            }


            const facultyData =
                facultySnapshot
                    .docs[0]
                    .data();


            console.log(
                "Faculty profile:",
                facultyData
            );


            /* =================================
               5. CHECK ACCOUNT STATUS
            ================================= */

            if (
                facultyData.account_status ===
                false
            ) {

                await signOut(auth);

                throw new Error(
                    "Your faculty account is disabled."
                );

            }


            if (
                facultyData.faculty_status ===
                false
            ) {

                await signOut(auth);

                throw new Error(
                    "Your faculty account is inactive."
                );

            }


            /* =================================
               6. SAVE FACULTY SESSION
            ================================= */

            sessionStorage.setItem(
                "userRole",
                "faculty"
            );


            sessionStorage.setItem(
                "facultyUid",
                user.uid
            );


            sessionStorage.setItem(
                "facultyId",
                facultyData.facultyId ||
                ""
            );


            sessionStorage.setItem(
                "facultyName",
                facultyData.name ||
                ""
            );


            sessionStorage.setItem(
                "facultyDepartment",
                facultyData.department ||
                ""
            );


            sessionStorage.setItem(
                "facultySubjects",
                JSON.stringify(
                    facultyData.subjects ||
                    []
                )
            );


            /* =================================
               7. SUCCESS
            ================================= */

            console.log(
                "Faculty authentication successful."
            );


            /* =================================
               8. REDIRECT
            ================================= */

            window.location.href =
                "faculty/dashboard.html";


        } catch (error) {

            console.error(
                "Faculty login error:",
                error
            );


            showLoginError(
                getLoginError(
                    error
                )
            );


        } finally {

            setLoading(false);

        }

    }
);


/* =========================================
   FORGOT PASSWORD
========================================= */

forgotPassword.addEventListener(
    "click",
    async (event) => {

        event.preventDefault();


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        if (!email) {

            showError(
                "emailError",
                "Enter your institutional email first."
            );

            emailInput.focus();

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            showLoginError(
                "Password reset email sent. Check your institutional inbox."
            );


        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );


            showLoginError(
                getLoginError(
                    error
                )
            );

        }

    }
);


/* =========================================
   LOADING STATE
========================================= */

function setLoading(
    loading
) {

    signinButton.disabled =
        loading;


    loader.style.display =
        loading
            ? "inline-block"
            : "none";


    buttonText.textContent =
        loading
            ? "Signing In..."
            : "Sign In";

}


/* =========================================
   SHOW FIELD ERROR
========================================= */

function showError(
    id,
    message
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            message;

    }

}


/* =========================================
   SHOW GENERAL ERROR
========================================= */

function showLoginError(
    message
) {

    loginError.textContent =
        message;


    loginError.style.display =
        "block";

}


/* =========================================
   CLEAR ERRORS
========================================= */

function clearErrors() {

    document
        .querySelectorAll(
            ".error-message"
        )
        .forEach(
            element => {

                element.textContent =
                    "";

            }
        );


    loginError.textContent =
        "";


    loginError.style.display =
        "none";

}


/* =========================================
   FIREBASE ERROR HANDLER
========================================= */

function getLoginError(
    error
) {

    if (
        error.code ===
        "auth/invalid-credential"
    ) {

        return "Invalid email or password.";

    }


    if (
        error.code ===
        "auth/user-not-found"
    ) {

        return "No account exists with this email.";

    }


    if (
        error.code ===
        "auth/wrong-password"
    ) {

        return "Invalid email or password.";

    }


    if (
        error.code ===
        "auth/too-many-requests"
    ) {

        return "Too many failed login attempts. Please try again later.";

    }


    if (
        error.code ===
        "auth/network-request-failed"
    ) {

        return "Network error. Check your internet connection.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return "Firestore denied access. Check the faculty role and Firestore rules.";

    }


    return error.message ||
        "Unable to sign in.";

}