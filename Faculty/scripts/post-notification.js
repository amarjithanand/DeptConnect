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
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
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
   INITIALIZE
========================================= */

const app =
    initializeApp(
        firebaseConfig
    );

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================
   DOM
========================================= */

const form =
    document.getElementById(
        "notificationForm"
    );

const titleInput =
    document.getElementById(
        "notificationTitle"
    );

const descriptionInput =
    document.getElementById(
        "notificationDescription"
    );

const publishButton =
    document.getElementById(
        "publishButton"
    );

const buttonText =
    document.getElementById(
        "buttonText"
    );

const loader =
    document.getElementById(
        "loader"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const departmentName =
    document.getElementById(
        "departmentName"
    );

const departmentPreview =
    document.getElementById(
        "departmentPreview"
    );

const titleCount =
    document.getElementById(
        "titleCount"
    );

const descriptionCount =
    document.getElementById(
        "descriptionCount"
    );

const titleError =
    document.getElementById(
        "titleError"
    );

const descriptionError =
    document.getElementById(
        "descriptionError"
    );

const previewTitle =
    document.getElementById(
        "previewTitle"
    );

const previewDescription =
    document.getElementById(
        "previewDescription"
    );

const previewTarget =
    document.getElementById(
        "previewTarget"
    );

const targetError =
    document.getElementById(
        "targetError"
    );


/* =========================================
   GLOBAL FACULTY DATA
========================================= */

let currentFaculty = null;


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Authenticated faculty UID:",
            user.uid
        );


        try {

            await loadFacultyProfile(
                user.uid
            );


        } catch (error) {

            console.error(
                "Faculty profile loading error:",
                error
            );


            showMessage(
                "Unable to load faculty profile.",
                "error"
            );

        }

    }
);


/* =========================================
   LOAD FACULTY PROFILE
========================================= */

async function loadFacultyProfile(
    uid
) {

    /*
     * faculty collection:
     *
     * faculty/{documentId}
     *
     * uid field = Firebase Auth UID
     */

    const facultyQuery =
        query(
            collection(
                db,
                "faculty"
            ),
            where(
                "uid",
                "==",
                uid
            )
        );


    const snapshot =
        await getDocs(
            facultyQuery
        );


    console.log(
        "Faculty documents found:",
        snapshot.size
    );


    if (
        snapshot.empty
    ) {

        throw new Error(
            "Faculty profile not found."
        );

    }


    const document =
        snapshot.docs[0];


    currentFaculty = {

        id:
            document.id,

        ...document.data()

    };


    console.log(
        "Current faculty:",
        currentFaculty
    );


    updateFacultyUI(
        currentFaculty
    );

}


/* =========================================
   UPDATE FACULTY UI
========================================= */

function updateFacultyUI(
    faculty
) {

    const name =
        faculty.name ||
        "Faculty";


    const department =
        faculty.department ||
        "Department";


    const facultyName =
        document.getElementById(
            "facultyName"
        );


    const facultyDepartment =
        document.getElementById(
            "facultyDepartment"
        );


    if (facultyName) {

        facultyName.textContent =
            name;

    }


    if (facultyDepartment) {

        facultyDepartment.textContent =
            department;

    }


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    const profileMenuAvatar =
        document.getElementById(
            "profileMenuAvatar"
        );


    if (
        faculty.profileImg
    ) {

        const image =
            `<img
                src="${escapeAttribute(
                    faculty.profileImg
                )}"
                alt="${escapeAttribute(
                    name
                )}"
                class="profile-image"
            >`;


        if (profileAvatar) {

            profileAvatar.innerHTML =
                image;

        }


        if (profileMenuAvatar) {

            profileMenuAvatar.innerHTML =
                image;

        }

    } else {

        const initial =
            name
                .charAt(0)
                .toUpperCase();


        if (profileAvatar) {

            profileAvatar.textContent =
                initial;

        }


        if (profileMenuAvatar) {

            profileMenuAvatar.textContent =
                initial;

        }

    }


    if (departmentName) {

        departmentName.textContent =
            department;

    }

}


/* =========================================
   TARGET CHANGE
========================================= */

document
    .querySelectorAll(
        'input[name="targetType"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                updateTargetPreview
            );

        }
    );


function updateTargetPreview() {

    const target =
        getTargetType();


    if (
        target ===
        "department"
    ) {

        departmentPreview.style.display =
            "flex";


        previewTarget.textContent =
            currentFaculty
                ? `${(
                    currentFaculty.department ||
                    "MY DEPARTMENT"
                ).toUpperCase()} STUDENTS`
                : "MY DEPARTMENT";

    } else {

        departmentPreview.style.display =
            "none";


        previewTarget.textContent =
            "ALL STUDENTS";

    }

}


/* =========================================
   GET TARGET TYPE
========================================= */

function getTargetType() {

    const selected =
        document.querySelector(
            'input[name="targetType"]:checked'
        );


    return selected
        ? selected.value
        : "all";

}


/* =========================================
   LIVE PREVIEW
========================================= */

titleInput.addEventListener(
    "input",
    () => {

        const value =
            titleInput.value.trim();


        titleCount.textContent =
            `${titleInput.value.length} / 150`;


        previewTitle.textContent =
            value ||
            "Notification title";

    }
);


descriptionInput.addEventListener(
    "input",
    () => {

        const value =
            descriptionInput.value.trim();


        descriptionCount.textContent =
            `${descriptionInput.value.length} / 1000`;


        previewDescription.textContent =
            value ||
            "Your notification description will appear here.";

    }
);


/* =========================================
   SUBMIT
========================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        clearErrors();


        const title =
            titleInput.value.trim();


        const description =
            descriptionInput.value.trim();


        const targetType =
            getTargetType();


        /* =============================
           VALIDATION
        ============================= */

        let valid = true;


        if (!title) {

            titleError.textContent =
                "Please enter a notification title.";

            valid = false;

        }


        if (title.length > 150) {

            titleError.textContent =
                "Title cannot exceed 150 characters.";

            valid = false;

        }


        if (!description) {

            descriptionError.textContent =
                "Please enter a notification description.";

            valid = false;

        }


        if (
            description.length >
            1000
        ) {

            descriptionError.textContent =
                "Description cannot exceed 1000 characters.";

            valid = false;

        }


        if (
            !currentFaculty
        ) {

            showMessage(
                "Faculty profile is not loaded yet.",
                "error"
            );

            valid = false;

        }


        if (
            targetType ===
            "department"
            &&
            !currentFaculty.department
        ) {

            targetError.textContent =
                "Your faculty profile does not have a department.";

            valid = false;

        }


        if (!valid) {

            return;

        }


        /* =============================
           LOADING
        ============================= */

        setLoading(
            true
        );


        try {

            const user =
                auth.currentUser;


            if (!user) {

                throw new Error(
                    "Authentication expired."
                );

            }


            /*
             * IMPORTANT:
             *
             * Department is automatically
             * taken from faculty profile.
             */

            const department =
                targetType ===
                "department"
                    ? currentFaculty.department
                    : null;


            /* =============================
               CREATE NOTIFICATION
            ============================= */

            const notificationData = {

                title:
                    title,

                description:
                    description,

                targetType:
                    targetType,

                department:
                    department,

                facultyUid:
                    user.uid,

                facultyId:
                    currentFaculty.facultyId ||
                    null,

                facultyName:
                    currentFaculty.name ||
                    "Faculty",

                createdAt:
                    serverTimestamp(),

                status:
                    "active"

            };


            console.log(
                "Creating notification:",
                notificationData
            );


            const notificationRef =
                await addDoc(
                    collection(
                        db,
                        "student-notification"
                    ),
                    notificationData
                );


            console.log(
                "Notification created:",
                notificationRef.id
            );


            /* =============================
               SUCCESS
            ============================= */

            showMessage(
                "Notification published successfully.",
                "success"
            );


            form.reset();


            titleCount.textContent =
                "0 / 150";


            descriptionCount.textContent =
                "0 / 1000";


            previewTitle.textContent =
                "Notification title";


            previewDescription.textContent =
                "Your notification description will appear here.";


            document.querySelector(
                'input[name="targetType"][value="all"]'
            ).checked = true;


            updateTargetPreview();


        } catch (error) {

            console.error(
                "Notification publishing error:",
                error
            );


            if (
                error.code ===
                "permission-denied"
            ) {

                showMessage(
                    "Firestore denied this notification. Check your faculty notification rules.",
                    "error"
                );

            } else {

                showMessage(
                    error.message ||
                    "Unable to publish notification.",
                    "error"
                );

            }

        } finally {

            setLoading(
                false
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

    publishButton.disabled =
        loading;


    if (loading) {

        buttonText.textContent =
            "Publishing...";


        loader.style.display =
            "block";

    } else {

        buttonText.textContent =
            "Publish Notification";


        loader.style.display =
            "none";

    }

}


/* =========================================
   MESSAGES
========================================= */

function showMessage(
    message,
    type
) {

    formMessage.textContent =
        message;


    formMessage.className =
        `form-message ${type}`;


    formMessage.style.display =
        "block";


    if (
        type ===
        "success"
    ) {

        setTimeout(
            () => {

                formMessage.style.display =
                    "none";

            },
            4000
        );

    }

}


function clearErrors() {

    titleError.textContent =
        "";

    descriptionError.textContent =
        "";

    targetError.textContent =
        "";

    formMessage.style.display =
        "none";

}


/* =========================================
   PROFILE MENU
========================================= */

const profileButton =
    document.getElementById(
        "profileButton"
    );

const profileMenu =
    document.getElementById(
        "profileMenu"
    );


if (
    profileButton &&
    profileMenu
) {

    profileButton.addEventListener(
        "click",
        event => {

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


    profileMenu.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                sessionStorage.clear();


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeAttribute(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


/* =========================================
   INITIAL TARGET UI
========================================= */

updateTargetPreview();