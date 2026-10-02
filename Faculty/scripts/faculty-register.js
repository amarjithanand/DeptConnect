/* =========================================================
   DEPTCONNECT FACULTY REGISTRATION
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

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
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

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



/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(app);


const db =
    getFirestore(app);



/* =========================================================
   DOM ELEMENTS
========================================================= */

const form =
    document.getElementById(
        "facultyRegisterForm"
    );


const nameInput =
    document.getElementById(
        "name"
    );


const facultyIdInput =
    document.getElementById(
        "facultyId"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const departmentInput =
    document.getElementById(
        "department"
    );


const designationInput =
    document.getElementById(
        "designation"
    );


const subjectInput =
    document.getElementById(
        "subjectInput"
    );


const addSubjectButton =
    document.getElementById(
        "addSubjectButton"
    );


const subjectsContainer =
    document.getElementById(
        "subjectsContainer"
    );


const profileImgInput =
    document.getElementById(
        "profileImg"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );


const passwordStrength =
    document.getElementById(
        "passwordStrength"
    );


const registerButton =
    document.getElementById(
        "registerButton"
    );


const registerButtonText =
    document.getElementById(
        "registerButtonText"
    );


const formMessage =
    document.getElementById(
        "formMessage"
    );



/* =========================================================
   GLOBAL DATA
========================================================= */

let subjects = [];



/* =========================================================
   MESSAGE HANDLING
========================================================= */

function showMessage(
    message,
    type
) {

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message show ${type}`;

}


function hideMessage() {

    formMessage.textContent =
        "";

    formMessage.className =
        "form-message";

}



/* =========================================================
   FIELD ERROR HANDLING
========================================================= */

function setFieldError(
    fieldId,
    message
) {

    const field =
        document.getElementById(
            fieldId
        );


    const error =
        document.getElementById(
            `${fieldId}Error`
        );


    if (field) {

        field.classList.add(
            "invalid"
        );

    }


    if (error) {

        error.textContent =
            message;

    }

}


function clearFieldError(
    fieldId
) {

    const field =
        document.getElementById(
            fieldId
        );


    const error =
        document.getElementById(
            `${fieldId}Error`
        );


    if (field) {

        field.classList.remove(
            "invalid"
        );

    }


    if (error) {

        error.textContent =
            "";

    }

}


function clearAllErrors() {

    const fields = [

        "name",

        "facultyId",

        "email",

        "department",

        "designation",

        "subjects",

        "password",

        "confirmPassword"

    ];


    fields.forEach(
        field => {

            clearFieldError(
                field
            );

        }
    );

}



/* =========================================================
   SUBJECT MANAGEMENT
========================================================= */

function renderSubjects() {

    subjectsContainer.innerHTML =
        "";


    subjects.forEach(
        (
            subject,
            index
        ) => {

            const tag =
                document.createElement(
                    "div"
                );


            tag.className =
                "subject-tag";


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                subject;


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.className =
                "remove-subject";


            removeButton.textContent =
                "×";


            removeButton.setAttribute(
                "aria-label",
                `Remove ${subject}`
            );


            removeButton.addEventListener(
                "click",
                () => {

                    subjects.splice(
                        index,
                        1
                    );

                    renderSubjects();

                }
            );


            tag.appendChild(
                text
            );


            tag.appendChild(
                removeButton
            );


            subjectsContainer.appendChild(
                tag
            );

        }
    );

}


function addSubject() {

    const value =
        subjectInput.value.trim();


    if (!value) {

        return;

    }


    const normalizedValue =
        value.toLowerCase();


    const alreadyExists =
        subjects.some(
            subject =>
                subject.toLowerCase() ===
                normalizedValue
        );


    if (alreadyExists) {

        showMessage(
            "This subject has already been added.",
            "error"
        );

        return;

    }


    subjects.push(
        value
    );


    subjectInput.value =
        "";


    clearFieldError(
        "subjects"
    );


    hideMessage();


    renderSubjects();


    subjectInput.focus();

}



/* =========================================================
   ADD SUBJECT BUTTON
========================================================= */

addSubjectButton.addEventListener(
    "click",
    addSubject
);



/* =========================================================
   ENTER KEY FOR SUBJECTS
========================================================= */

subjectInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            addSubject();

        }

    }
);



/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

document
    .querySelectorAll(
        ".password-toggle"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.target;


                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";

                        button.textContent =
                            "Hide";

                    } else {

                        input.type =
                            "password";

                        button.textContent =
                            "Show";

                    }

                }
            );

        }
    );



/* =========================================================
   PASSWORD STRENGTH
========================================================= */

passwordInput.addEventListener(
    "input",
    () => {

        const password =
            passwordInput.value;


        passwordStrength.className =
            "password-strength";


        if (!password) {

            return;

        }


        let score = 0;


        if (
            password.length >= 6
        ) {

            score++;

        }


        if (
            password.length >= 10
        ) {

            score++;

        }


        if (
            /[A-Z]/.test(password)
        ) {

            score++;

        }


        if (
            /[0-9]/.test(password)
        ) {

            score++;

        }


        if (
            /[^A-Za-z0-9]/.test(password)
        ) {

            score++;

        }


        if (
            score <= 2
        ) {

            passwordStrength.classList.add(
                "weak"
            );

        } else if (
            score <= 4
        ) {

            passwordStrength.classList.add(
                "medium"
            );

        } else {

            passwordStrength.classList.add(
                "strong"
            );

        }

    }
);



/* =========================================================
   VALIDATE EMAIL
========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}



/* =========================================================
   VALIDATE PROFILE IMAGE URL
========================================================= */

function isValidUrl(
    value
) {

    if (!value) {

        return true;

    }


    try {

        new URL(value);

        return true;

    } catch {

        return false;

    }

}



/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    clearAllErrors();

    hideMessage();


    let valid =
        true;


    const name =
        nameInput.value.trim();


    const facultyId =
        facultyIdInput.value.trim();


    const email =
        emailInput.value.trim();


    const department =
        departmentInput.value;


    const designation =
        designationInput.value;


    const password =
        passwordInput.value;


    const confirmPassword =
        confirmPasswordInput.value;


    const profileImg =
        profileImgInput.value.trim();



    /* =========================================
       NAME
    ========================================== */

    if (
        name.length < 2
    ) {

        setFieldError(
            "name",
            "Please enter a valid faculty name."
        );

        valid = false;

    }



    /* =========================================
       FACULTY ID
    ========================================== */

    if (
        facultyId.length < 4
    ) {

        setFieldError(
            "facultyId",
            "Please enter a valid faculty ID."
        );

        valid = false;

    }



    /* =========================================
       EMAIL
    ========================================== */

    if (
        !isValidEmail(email)
    ) {

        setFieldError(
            "email",
            "Please enter a valid email address."
        );

        valid = false;

    }



    /* =========================================
       DEPARTMENT
    ========================================== */

    if (!department) {

        setFieldError(
            "department",
            "Please select a department."
        );

        valid = false;

    }



    /* =========================================
       DESIGNATION
    ========================================== */

    if (!designation) {

        setFieldError(
            "designation",
            "Please select a designation."
        );

        valid = false;

    }



    /* =========================================
       SUBJECTS
    ========================================== */

    if (
        subjects.length === 0
    ) {

        setFieldError(
            "subjects",
            "Add at least one subject."
        );

        valid = false;

    }



    /* =========================================
       PASSWORD
    ========================================== */

    if (
        password.length < 6
    ) {

        setFieldError(
            "password",
            "Password must contain at least 6 characters."
        );

        valid = false;

    }



    /* =========================================
       CONFIRM PASSWORD
    ========================================== */

    if (
        password !==
        confirmPassword
    ) {

        setFieldError(
            "confirmPassword",
            "Passwords do not match."
        );

        valid = false;

    }



    /* =========================================
       PROFILE IMAGE
    ========================================== */

    if (
        !isValidUrl(profileImg)
    ) {

        setFieldError(
            "profileImg",
            "Please enter a valid image URL."
        );

        valid = false;

    }


    return valid;

}



/* =========================================================
   CHECK FACULTY ID
========================================================= */

async function facultyIdExists(
    facultyId
) {

    const facultyQuery =
        query(

            collection(
                db,
                "faculty"
            ),

            where(
                "facultyId",
                "==",
                facultyId
            )

        );


    const snapshot =
        await getDocs(
            facultyQuery
        );


    return !snapshot.empty;

}



/* =========================================================
   LOADING STATE
========================================================= */

function setLoading(
    loading
) {

    registerButton.disabled =
        loading;


    if (loading) {

        registerButton.classList.add(
            "loading"
        );


        registerButtonText.textContent =
            "Creating Account...";

    } else {

        registerButton.classList.remove(
            "loading"
        );


        registerButtonText.textContent =
            "Create Faculty Account";

    }

}



/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

function getFirebaseErrorMessage(
    error
) {

    switch (
        error.code
    ) {

        case "auth/email-already-in-use":

            return (
                "An account already exists with this email address."
            );


        case "auth/invalid-email":

            return (
                "The email address is invalid."
            );


        case "auth/weak-password":

            return (
                "The password is too weak."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Please check your internet connection."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/password authentication is not enabled in Firebase."
            );


        default:

            return (
                error.message ||
                "Registration failed. Please try again."
            );

    }

}



/* =========================================================
   REGISTRATION
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !validateForm()
        ) {

            showMessage(
                "Please correct the highlighted fields.",
                "error"
            );

            return;

        }


        setLoading(
            true
        );


        try {


            /* =====================================
               1. NORMALIZE FACULTY ID
            ====================================== */

            const facultyId =
                facultyIdInput.value
                    .trim()
                    .toUpperCase();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            const name =
                nameInput.value
                    .trim();


            const department =
                departmentInput.value;


            const designation =
                designationInput.value;


            const password =
                passwordInput.value;


            const profileImg =
                profileImgInput.value
                    .trim();


            /* =====================================
               2. CHECK DUPLICATE FACULTY ID
            ====================================== */

            const exists =
                await facultyIdExists(
                    facultyId
                );


            if (exists) {

                setFieldError(
                    "facultyId",
                    "This Faculty ID is already registered."
                );


                showMessage(
                    "A faculty account with this Faculty ID already exists.",
                    "error"
                );


                setLoading(
                    false
                );


                return;

            }



            /* =====================================
               3. CREATE FIREBASE AUTH ACCOUNT
            ====================================== */

            const userCredential =
                await createUserWithEmailAndPassword(

                    auth,

                    email,

                    password

                );


            const user =
                userCredential.user;



            /* =====================================
               4. UPDATE AUTH DISPLAY NAME
            ====================================== */

            await updateProfile(
                user,
                {
                    displayName:
                        name
                }
            );



            /* =====================================
               5. CREATE FACULTY FIRESTORE DOCUMENT
            ====================================== */

            const facultyData = {

                /*
                 * Firebase Authentication UID
                 */

                uid:
                    user.uid,


                /*
                 * Faculty information
                 */

                facultyId:
                    facultyId,

                name:
                    name,

                email:
                    email,

                department:
                    department,

                designation:
                    designation,


                /*
                 * Subjects / expertise
                 */

                subjects:
                    subjects,


                /*
                 * Profile image
                 *
                 * Existing database uses
                 * "null" as a string.
                 * We preserve that convention.
                 */

                profileImg:
                    profileImg ||
                    "null",


                /*
                 * Account status
                 */

                account_status:
                    true,

                faculty_status:
                    true,


                /*
                 * Admin approval
                 *
                 * New faculty accounts start
                 * as unapproved.
                 */

                isApproved:
                    false,


                /*
                 * Creation timestamp
                 */

                createdAt:
                    serverTimestamp()

            };



            await addDoc(

                collection(
                    db,
                    "faculty"
                ),

                facultyData

            );



            /* =====================================
               6. SUCCESS
            ====================================== */

            showMessage(

                "Faculty account created successfully. Your account is now waiting for administrator approval.",

                "success"

            );


            /* =====================================
               7. RESET FORM
            ====================================== */

            form.reset();


            subjects =
                [];


            renderSubjects();


            passwordStrength.className =
                "password-strength";


            clearAllErrors();



            /* =====================================
               8. REDIRECT
            ====================================== */

            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                2500
            );


        } catch (error) {

            console.error(
                "Faculty registration error:",
                error
            );


            showMessage(

                getFirebaseErrorMessage(
                    error
                ),

                "error"

            );

        } finally {

            setLoading(
                false
            );

        }

    }
);