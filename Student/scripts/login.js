/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",
    authDomain: "deptconnect-8b81c.firebaseapp.com",
    projectId: "deptconnect-8b81c",
    storageBucket: "deptconnect-8b81c.firebasestorage.app",
    messagingSenderId: "916956737819",
    appId: "1:916956737819:web:8fc9920e834ac99e66e3be",
    measurementId: "G-2B4VN12YW5"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   DOM ELEMENTS
========================================================= */

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


/* =========================================================
   SHOW LOGIN ERROR
========================================================= */

function showLoginError(message) {

    if (!loginError) {
        return;
    }

    loginError.textContent = message;

    loginError.classList.add("show");
}


/* =========================================================
   CLEAR ERRORS
========================================================= */

function clearErrors() {

    if (loginError) {
        loginError.textContent = "";
        loginError.classList.remove("show");
    }

    if (emailError) {
        emailError.textContent = "";
    }

    if (passwordError) {
        passwordError.textContent = "";
    }
}


/* =========================================================
   LOADING STATE
========================================================= */

function setLoading(isLoading) {

    if (signinButton) {
        signinButton.disabled = isLoading;
    }

    if (isLoading) {

        if (buttonText) {
            buttonText.textContent = "Signing In...";
        }

        if (loader) {
            loader.style.display = "inline-block";
        }

    } else {

        if (buttonText) {
            buttonText.textContent = "Sign In";
        }

        if (loader) {
            loader.style.display = "none";
        }
    }
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearErrors();


        /* =================================================
           GET INPUT VALUES
        ================================================= */

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value;


        /* =================================================
           BASIC VALIDATION
        ================================================= */

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

            /* =================================================
               STEP 1
               AUTH PERSISTENCE
            ================================================= */

            await setPersistence(
                auth,
                rememberMe.checked
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );


            /* =================================================
               STEP 2
               FIREBASE AUTHENTICATION
            ================================================= */

            console.log(
                "STEP 1: Authenticating student..."
            );

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "Authentication successful."
            );

            console.log(
                "Authenticated UID:",
                user.uid
            );


            /* =================================================
               STEP 3
               FIND USER ROLE

               role
               └── randomDocumentId
                   ├── uid
                   └── role
            ================================================= */

            console.log(
                "STEP 2: Checking student role..."
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
                "Role documents found:",
                roleSnapshot.size
            );


            /* =================================================
               ROLE NOT FOUND
            ================================================= */

            if (roleSnapshot.empty) {

                await signOut(auth);

                showLoginError(
                    "Your account does not have a registered role."
                );

                setLoading(false);

                return;
            }


            /* =================================================
               GET ROLE DATA
            ================================================= */

            const roleData =
                roleSnapshot.docs[0].data();


            console.log(
                "Role data:",
                roleData
            );


            /* =================================================
               VERIFY STUDENT ROLE
            ================================================= */

            if (
                roleData.role !== "student"
            ) {

                await signOut(auth);

                showLoginError(
                    "This account is not registered as a student."
                );

                setLoading(false);

                return;
            }


            console.log(
                "Student role verified."
            );


            /* =================================================
               STEP 4
               FIND STUDENT PROFILE

               students
               └── student document
                   ├── uid
                   ├── studentId
                   ├── name
                   ├── email
                   ├── department
                   ├── programme
                   ├── semester
                   ├── isApproved
                   ├── account_status
                   └── student_status
            ================================================= */

            console.log(
                "STEP 3: Checking student profile..."
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
                "Student documents found:",
                studentSnapshot.size
            );


            /* =================================================
               STUDENT PROFILE NOT FOUND
            ================================================= */

            if (
                studentSnapshot.empty
            ) {

                await signOut(auth);

                showLoginError(
                    "Student profile was not found."
                );

                setLoading(false);

                return;
            }


            /* =================================================
               GET STUDENT DATA
            ================================================= */

            const studentDocument =
                studentSnapshot.docs[0];


            const studentData =
                studentDocument.data();


            console.log(
                "Student profile:",
                studentData
            );


            /* =================================================
               STEP 5
               ADMIN APPROVAL CHECK

               IMPORTANT:

               The student must be explicitly approved.

               isApproved === true
                   → continue

               isApproved === false
                   → registration pending

               isApproved missing
                   → registration pending
            ================================================= */

            console.log(
                "STEP 4: Checking student approval..."
            );


            if (
                studentData.isApproved !== true
            ) {

                console.log(
                    "Student registration is pending approval."
                );


                /*
                 * Sign out first so an unapproved
                 * student cannot remain authenticated.
                 */

                await signOut(auth);


                /*
                 * Redirect to the dedicated
                 * student pending approval page.
                 */

                window.location.href =
                    "registration-pending.html";

                return;
            }


            console.log(
                "Student approval verified."
            );


            /* =================================================
               STEP 6
               ACCOUNT STATUS CHECK

               Must explicitly be true.
            ================================================= */

            console.log(
                "STEP 5: Checking account status..."
            );


            if (
                studentData.account_status !== true
            ) {

                await signOut(auth);

                showLoginError(
                    "Your account is currently inactive."
                );

                setLoading(false);

                return;
            }


            console.log(
                "Account status verified."
            );


            /* =================================================
               STEP 7
               STUDENT STATUS CHECK

               Must explicitly be true.
            ================================================= */

            console.log(
                "STEP 6: Checking student status..."
            );


            if (
                studentData.student_status !== true
            ) {

                await signOut(auth);

                showLoginError(
                    "Your student account is inactive."
                );

                setLoading(false);

                return;
            }


            console.log(
                "Student status verified."
            );


            /* =================================================
               STEP 8
               STORE SESSION DATA
            ================================================= */

            console.log(
                "STEP 7: Saving student session..."
            );


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
                studentData.studentId || ""
            );


            sessionStorage.setItem(
                "deptconnect_student_name",
                studentData.name || ""
            );


            sessionStorage.setItem(
                "deptconnect_student_email",
                studentData.email ||
                user.email ||
                ""
            );


            /*
             * Additional useful session data
             */

            sessionStorage.setItem(
                "deptconnect_student_department",
                studentData.department || ""
            );


            sessionStorage.setItem(
                "deptconnect_student_programme",
                studentData.programme || ""
            );


            sessionStorage.setItem(
                "deptconnect_student_semester",
                studentData.semester !== undefined
                    ? String(studentData.semester)
                    : ""
            );


            /* =================================================
               STEP 9
               LOGIN SUCCESS
            ================================================= */

            console.log(
                "Student verified successfully."
            );


            console.log(
                "Student:",
                studentData.name
            );


            console.log(
                "Redirecting to student dashboard..."
            );


            if (buttonText) {
                buttonText.textContent = "Success!";
            }


            /*
             * Redirect immediately.
             */

            window.location.href =
                "dashboard.html";

        }


        /* =====================================================
           LOGIN ERROR
        ===================================================== */

        catch (error) {

            console.error(
                "Student login error:",
                error
            );


            handleFirebaseError(
                error
            );


            setLoading(false);
        }

    }
);


/* =========================================================
   FIREBASE ERROR HANDLING
========================================================= */

function handleFirebaseError(error) {

    console.error(
        "Firebase error code:",
        error?.code
    );

    console.error(
        "Firebase error message:",
        error?.message
    );


    switch (error?.code) {


        /* =================================================
           INVALID CREDENTIAL
        ================================================= */

        case "auth/invalid-credential":

            showLoginError(
                "Invalid email or password."
            );

            break;


        /* =================================================
           USER NOT FOUND
        ================================================= */

        case "auth/user-not-found":

            showLoginError(
                "No account exists with this email."
            );

            break;


        /* =================================================
           WRONG PASSWORD
        ================================================= */

        case "auth/wrong-password":

            showLoginError(
                "Incorrect password."
            );

            break;


        /* =================================================
           INVALID EMAIL
        ================================================= */

        case "auth/invalid-email":

            if (emailError) {

                emailError.textContent =
                    "Please enter a valid email address.";

            }

            break;


        /* =================================================
           USER DISABLED IN FIREBASE AUTH
        ================================================= */

        case "auth/user-disabled":

            showLoginError(
                "This account has been disabled."
            );

            break;


        /* =================================================
           TOO MANY REQUESTS
        ================================================= */

        case "auth/too-many-requests":

            showLoginError(
                "Too many unsuccessful attempts. Please try again later."
            );

            break;


        /* =================================================
           NETWORK ERROR
        ================================================= */

        case "auth/network-request-failed":

            showLoginError(
                "Network error. Please check your internet connection."
            );

            break;


        /* =================================================
           FIRESTORE PERMISSION ERROR
        ================================================= */

        case "permission-denied":

        case "firestore/permission-denied":

            showLoginError(
                "Access denied. Please check your account permissions."
            );

            break;


        /* =================================================
           DEFAULT
        ================================================= */

        default:

            showLoginError(
                "Unable to sign in. Please try again."
            );

            break;
    }
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPassword.addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        clearErrors();


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        /* =================================================
           EMAIL REQUIRED
        ================================================= */

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

        }


        catch (error) {

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


/* =========================================================
   CLEAR ERRORS WHEN TYPING EMAIL
========================================================= */

emailInput.addEventListener(
    "input",
    () => {

        if (emailError) {
            emailError.textContent = "";
        }

        if (loginError) {

            loginError.textContent = "";

            loginError.classList.remove(
                "show"
            );
        }

    }
);


/* =========================================================
   CLEAR ERRORS WHEN TYPING PASSWORD
========================================================= */

passwordInput.addEventListener(
    "input",
    () => {

        if (passwordError) {
            passwordError.textContent = "";
        }

        if (loginError) {

            loginError.textContent = "";

            loginError.classList.remove(
                "show"
            );
        }

    }
);