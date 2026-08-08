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
    updateDoc
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

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================
   DOM ELEMENTS
========================================= */

const profileImage =
    document.getElementById("profileImage");

const profilePlaceholder =
    document.getElementById("profilePlaceholder");

const navAvatar =
    document.getElementById("navAvatar");

const profileName =
    document.getElementById("profileName");

const profileProgramme =
    document.getElementById("profileProgramme");

const profileStudentId =
    document.getElementById("profileStudentId");

const profileStatus =
    document.getElementById("profileStatus");

const fullName =
    document.getElementById("fullName");

const fullNameInput =
    document.getElementById("fullNameInput");

const studentId =
    document.getElementById("studentId");

const email =
    document.getElementById("email");

const phoneNumber =
    document.getElementById("phoneNumber");

const phoneInput =
    document.getElementById("phoneInput");

const dob =
    document.getElementById("dob");

const gender =
    document.getElementById("gender");

const programme =
    document.getElementById("programme");

const department =
    document.getElementById("department");

const semester =
    document.getElementById("semester");

const batch =
    document.getElementById("batch");

const academicYear =
    document.getElementById("academicYear");

const studentStatus =
    document.getElementById("studentStatus");

const accountStatus =
    document.getElementById("accountStatus");

const memberSince =
    document.getElementById("memberSince");

const lastUpdated =
    document.getElementById("lastUpdated");


/* =========================================
   PROFILE PHOTO ELEMENTS
========================================= */

const photoModal =
    document.getElementById("photoModal");

const photoInput =
    document.getElementById("photoInput");

const photoPreview =
    document.getElementById("photoPreview");

const previewPlaceholder =
    document.getElementById("previewPlaceholder");

const changePhotoButton =
    document.getElementById("changePhotoButton");

const uploadPhotoButton =
    document.getElementById("uploadPhotoButton");

const removePhotoButton =
    document.getElementById("removePhotoButton");

const savePhotoButton =
    document.getElementById("savePhotoButton");

const cancelPhotoButton =
    document.getElementById("cancelPhotoButton");

const closePhotoModal =
    document.getElementById("closePhotoModal");


/* =========================================
   OTHER ELEMENTS
========================================= */

const profileButton =
    document.getElementById("profileButton");

const profileMenu =
    document.getElementById("profileMenu");

const notificationButton =
    document.getElementById("notificationButton");


/* =========================================
   CURRENT STUDENT
========================================= */

let currentStudent = null;

let currentStudentDocument = null;

let selectedPhotoUrl = null;


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Authenticated UID:",
            user.uid
        );


        await loadStudentProfile(
            user.uid
        );

    }
);


/* =========================================
   LOAD STUDENT PROFILE
========================================= */

async function loadStudentProfile(uid) {

    try {

        console.log(
            "Fetching student profile..."
        );


        const studentQuery =
            query(
                collection(
                    db,
                    "students"
                ),
                where(
                    "uid",
                    "==",
                    uid
                )
            );


        const snapshot =
            await getDocs(
                studentQuery
            );


        console.log(
            "Student documents found:",
            snapshot.size
        );


        if (snapshot.empty) {

            console.error(
                "Student profile not found."
            );

            showToast(
                "Student profile not found"
            );

            return;

        }


        currentStudentDocument =
            snapshot.docs[0];


        currentStudent =
            currentStudentDocument.data();


        console.log(
            "Student data:",
            currentStudent
        );


        populateProfile(
            currentStudent
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showToast(
            "Unable to load profile"
        );

    }

}


/* =========================================
   POPULATE PROFILE
========================================= */

function populateProfile(data) {

    const name =
        data.name || "Student";


    /* -------------------------------
       PROFILE HERO
    -------------------------------- */

    profileName.textContent =
        name;


    profileProgramme.textContent =
        `${data.programme || "Student"} Student`;


    profileStudentId.textContent =
        data.studentId ||
        "Not available";


    /* -------------------------------
       PERSONAL
    -------------------------------- */

    fullName.textContent =
        name;


    fullNameInput.value =
        name;


    studentId.textContent =
        data.studentId ||
        "Not available";


    email.textContent =
        data.email ||
        "Not available";


    if (data.phone) {

        phoneNumber.textContent =
            data.phone;

        phoneInput.value =
            data.phone;

    } else {

        phoneNumber.textContent =
            "Not provided";

        phoneInput.value =
            "";

    }


    dob.textContent =
        formatDate(
            data.dob
        );


    gender.textContent =
        formatGender(
            data.gender
        );


    /* -------------------------------
       ACADEMIC
    -------------------------------- */

    programme.textContent =
        data.programme ||
        "Not available";


    department.textContent =
        data.department ||
        "Not available";


    semester.textContent =
        formatSemester(
            data.semester
        );


    batch.textContent =
        formatBatch(
            data.batch
        );


    academicYear.textContent =
        calculateAcademicYear(
            data.batch,
            data.semester
        );


    const activeStudent =
        data.student_status === true;


    studentStatus.textContent =
        activeStudent
            ? "Active"
            : "Inactive";


    /* -------------------------------
       ACCOUNT
    -------------------------------- */

    const activeAccount =
        data.account_status === true;


    accountStatus.textContent =
        activeAccount
            ? "Active"
            : "Inactive";


    profileStatus.textContent =
        activeStudent
            ? "Active Student"
            : "Inactive Student";


    memberSince.textContent =
        formatMemberSince(
            data.createdAt
        );


    if (data.updatedAt) {

        lastUpdated.textContent =
            formatDateTime(
                data.updatedAt
            );

    } else {

        lastUpdated.textContent =
            "Not available";

    }


    /* -------------------------------
       PROFILE IMAGE
    -------------------------------- */

    setProfileImage(
        data.profileImg,
        name
    );

}


/* =========================================
   SET PROFILE IMAGE
========================================= */

function setProfileImage(
    imageUrl,
    name
) {

    const firstLetter =
        name
            .trim()
            .charAt(0)
            .toUpperCase();


    navAvatar.textContent =
        firstLetter;


    profilePlaceholder.textContent =
        firstLetter;


    if (
        imageUrl &&
        imageUrl.trim() !== ""
    ) {

        profileImage.src =
            imageUrl;

        profileImage.style.display =
            "block";

        profilePlaceholder.style.display =
            "none";

    } else {

        profileImage.removeAttribute(
            "src"
        );

        profileImage.style.display =
            "none";

        profilePlaceholder.style.display =
            "flex";

    }

}


/* =========================================
   DATE FORMAT
========================================= */

function getDateFromFirebaseValue(
    value
) {

    if (!value) {

        return null;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        value.seconds !== undefined
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


function formatDate(value) {

    const date =
        getDateFromFirebaseValue(
            value
        );


    if (!date) {

        return "Not available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


function formatDateTime(value) {

    const date =
        getDateFromFirebaseValue(
            value
        );


    if (!date) {

        return "Not available";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function formatMemberSince(value) {

    const date =
        getDateFromFirebaseValue(
            value
        );


    if (!date) {

        return "Not available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric"
        }
    );

}


/* =========================================
   FORMAT GENDER
========================================= */

function formatGender(value) {

    if (!value) {

        return "Not specified";

    }


    return (
        value.charAt(0).toUpperCase()
        +
        value.slice(1)
    );

}


/* =========================================
   FORMAT SEMESTER
========================================= */

function formatSemester(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "Not available";

    }


    const suffix =
        value === 1
            ? "st"
            : value === 2
                ? "nd"
                : value === 3
                    ? "rd"
                    : "th";


    return `${value}${suffix} Semester`;

}


/* =========================================
   FORMAT BATCH
========================================= */

function formatBatch(value) {

    if (!value) {

        return "Not available";

    }


    return value.replace(
        "-",
        " – "
    );

}


/* =========================================
   ACADEMIC YEAR
========================================= */

function calculateAcademicYear(
    batchValue,
    semesterValue
) {

    if (
        !batchValue ||
        semesterValue === null ||
        semesterValue === undefined
    ) {

        return "Not available";

    }


    const parts =
        batchValue.split("-");


    if (parts.length !== 2) {

        return "Not available";

    }


    const startYear =
        parseInt(
            parts[0],
            10
        );


    if (
        Number.isNaN(startYear)
    ) {

        return "Not available";

    }


    /*
        Example:

        Batch: 2025-27

        Semester 1/2
        → 2025-26

        Semester 3/4
        → 2026-27

        Semester 5/6
        → 2027-28
    */

    const academicStartYear =
        startYear +
        Math.floor(
            (semesterValue - 1) / 2
        );


    const academicEndYear =
        academicStartYear + 1;


    return `${academicStartYear} – ${academicEndYear}`;

}


/* =========================================
   EDIT PERSONAL INFORMATION
========================================= */

document
    .querySelectorAll(
        ".edit-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.dataset.section !==
                        "personal"
                    ) {

                        return;

                    }


                    fullName.hidden =
                        true;

                    fullNameInput.hidden =
                        false;


                    phoneNumber.hidden =
                        true;

                    phoneInput.hidden =
                        false;


                    document
                        .getElementById(
                            "personalActions"
                        )
                        .hidden =
                        false;

                }
            );

        }
    );


/* =========================================
   CANCEL PERSONAL EDIT
========================================= */

document
    .querySelectorAll(
        "[data-cancel]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    fullName.hidden =
                        false;

                    fullNameInput.hidden =
                        true;


                    phoneNumber.hidden =
                        false;

                    phoneInput.hidden =
                        true;


                    document
                        .getElementById(
                            "personalActions"
                        )
                        .hidden =
                        true;


                    if (currentStudent) {

                        fullNameInput.value =
                            currentStudent.name ||
                            "";

                        phoneInput.value =
                            currentStudent.phone ||
                            "";

                    }

                }
            );

        }
    );


/* =========================================
   SAVE PERSONAL INFORMATION
========================================= */

document
    .querySelectorAll(
        "[data-save]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    if (
                        !currentStudentDocument
                    ) {

                        showToast(
                            "Profile is still loading"
                        );

                        return;

                    }


                    const newName =
                        fullNameInput.value.trim();


                    const newPhone =
                        phoneInput.value.trim();


                    if (!newName) {

                        showToast(
                            "Name cannot be empty"
                        );

                        return;

                    }


                    try {

                        button.disabled =
                            true;


                        await updateDoc(
                            currentStudentDocument.ref,
                            {
                                name: newName,
                                phone: newPhone
                            }
                        );


                        currentStudent.name =
                            newName;

                        currentStudent.phone =
                            newPhone;


                        populateProfile(
                            currentStudent
                        );


                        fullName.hidden =
                            false;

                        fullNameInput.hidden =
                            true;


                        phoneNumber.hidden =
                            false;

                        phoneInput.hidden =
                            true;


                        document
                            .getElementById(
                                "personalActions"
                            )
                            .hidden =
                            true;


                        showToast(
                            "Profile updated successfully"
                        );


                    } catch (error) {

                        console.error(
                            "Profile update error:",
                            error
                        );


                        showToast(
                            "Unable to update profile"
                        );


                    } finally {

                        button.disabled =
                            false;

                    }

                }
            );

        }
    );


/* =========================================
   PROFILE PHOTO MODAL
========================================= */

changePhotoButton.addEventListener(
    "click",
    () => {

        openPhotoModal();

    }
);


function openPhotoModal() {

    selectedPhotoUrl = null;


    if (
        currentStudent &&
        currentStudent.profileImg
    ) {

        photoPreview.src =
            currentStudent.profileImg;

        photoPreview.style.display =
            "block";

        previewPlaceholder.style.display =
            "none";

    } else {

        photoPreview.removeAttribute(
            "src"
        );

        photoPreview.style.display =
            "none";

        previewPlaceholder.textContent =
            getFirstLetter();

        previewPlaceholder.style.display =
            "flex";

    }


    photoModal.classList.add(
        "show"
    );

}


function closePhotoModalFunction() {

    photoModal.classList.remove(
        "show"
    );

    photoInput.value = "";

    selectedPhotoUrl = null;

}


closePhotoModal.addEventListener(
    "click",
    closePhotoModalFunction
);


cancelPhotoButton.addEventListener(
    "click",
    closePhotoModalFunction
);


photoModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            photoModal
        ) {

            closePhotoModalFunction();

        }

    }
);


/* =========================================
   UPLOAD NEW PHOTO
========================================= */

uploadPhotoButton.addEventListener(
    "click",
    () => {

        photoInput.click();

    }
);


photoInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];


        if (!file) {

            return;

        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            showToast(
                "Only JPG, PNG or WEBP files are allowed"
            );

            photoInput.value = "";

            return;

        }


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            showToast(
                "Image must be smaller than 5 MB"
            );

            photoInput.value = "";

            return;

        }


        /*
            Temporary local preview.

            Actual Firebase Storage upload
            will be connected separately.
        */

        const reader =
            new FileReader();


        reader.onload =
            event => {

                selectedPhotoUrl =
                    event.target.result;


                photoPreview.src =
                    selectedPhotoUrl;

                photoPreview.style.display =
                    "block";

                previewPlaceholder.style.display =
                    "none";

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* =========================================
   REMOVE PHOTO
========================================= */

removePhotoButton.addEventListener(
    "click",
    () => {

        selectedPhotoUrl = "";


        photoPreview.removeAttribute(
            "src"
        );

        photoPreview.style.display =
            "none";


        previewPlaceholder.textContent =
            getFirstLetter();


        previewPlaceholder.style.display =
            "flex";

    }
);


/* =========================================
   SAVE PHOTO
========================================= */

savePhotoButton.addEventListener(
    "click",
    async () => {

        /*
            If a new local image was selected,
            Firebase Storage is required to
            permanently save it.

            We intentionally don't save a
            base64 image into Firestore.
        */

        if (
            selectedPhotoUrl &&
            selectedPhotoUrl.startsWith(
                "data:"
            )
        ) {

            showToast(
                "Image upload will be connected to Firebase Storage next"
            );

            return;

        }


        if (
            selectedPhotoUrl === ""
        ) {

            if (
                !currentStudentDocument
            ) {

                return;

            }


            try {

                await updateDoc(
                    currentStudentDocument.ref,
                    {
                        profileImg: ""
                    }
                );


                currentStudent.profileImg =
                    "";


                setProfileImage(
                    "",
                    currentStudent.name
                );


                closePhotoModalFunction();


                showToast(
                    "Profile photo removed"
                );


            } catch (error) {

                console.error(
                    "Remove photo error:",
                    error
                );


                showToast(
                    "Unable to remove photo"
                );

            }


            return;

        }


        closePhotoModalFunction();

    }
);


/* =========================================
   GET FIRST LETTER
========================================= */

function getFirstLetter() {

    if (
        !currentStudent ||
        !currentStudent.name
    ) {

        return "A";

    }


    return currentStudent.name
        .trim()
        .charAt(0)
        .toUpperCase();

}


/* =========================================
   PROFILE MENU
========================================= */

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


/* =========================================
   NOTIFICATIONS
========================================= */

notificationButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "notifications.html";

    }
);


/* =========================================
   LOGOUT
========================================= */

async function logout() {

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
            "Unable to logout"
        );

    }

}


document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        logout
    );


document
    .getElementById(
        "pageLogoutButton"
    )
    .addEventListener(
        "click",
        logout
    );