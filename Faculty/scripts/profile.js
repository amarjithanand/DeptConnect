/* =====================================================
   DEPTCONNECT FACULTY PROFILE
====================================================== */


/* =====================================================
   FIREBASE IMPORTS
====================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIGURATION
====================================================== */

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


/* =====================================================
   INITIALIZE FIREBASE
====================================================== */

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(app);


const db =
    getFirestore(app);


/* =====================================================
   GLOBAL DATA
====================================================== */

let currentUser = null;

let currentFaculty = null;

let currentFacultyDocumentId = null;

let editableSubjects = [];


/* =====================================================
   DOM ELEMENTS
====================================================== */

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


const pageLogoutButton =
    document.getElementById(
        "pageLogoutButton"
    );


const notificationButton =
    document.getElementById(
        "notificationButton"
    );


const loadingOverlay =
    document.getElementById(
        "loadingOverlay"
    );


const loadingText =
    document.getElementById(
        "loadingText"
    );


const toast =
    document.getElementById(
        "toast"
    );


/* =====================================================
   PROFILE MENU
====================================================== */

if (profileButton) {

    profileButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            profileMenu.classList.toggle(
                "active"
            );

        }
    );

}


document.addEventListener(
    "click",
    event => {

        if (
            profileMenu &&
            !profileMenu.contains(event.target) &&
            !profileButton.contains(event.target)
        ) {

            profileMenu.classList.remove(
                "active"
            );

        }

    }
);


/* =====================================================
   LOADING
====================================================== */

function setLoading(
    loading,
    message = "Loading profile..."
) {

    if (!loadingOverlay) {

        return;

    }


    loadingText.textContent =
        message;


    loadingOverlay.classList.toggle(
        "hidden",
        !loading
    );

}


/* =====================================================
   TOAST
====================================================== */

function showToast(
    message,
    success = true
) {

    if (!toast) {

        alert(message);

        return;

    }


    toast.textContent =
        message;


    toast.style.background =
        success
            ? "#166534"
            : "#b91c1c";


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


/* =====================================================
   GET INITIALS
====================================================== */

function getInitials(
    name
) {

    if (!name) {

        return "F";

    }


    const parts =
        name
            .trim()
            .split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


/* =====================================================
   LOAD FACULTY
====================================================== */

async function loadFaculty(
    uid
) {

    console.log(
        "Loading faculty profile for UID:",
        uid
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
                uid
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

        throw new Error(
            "Faculty profile not found."
        );

    }


    const facultyDocument =
        facultySnapshot.docs[0];


    currentFacultyDocumentId =
        facultyDocument.id;


    currentFaculty =
        facultyDocument.data();


    console.log(
        "Faculty profile:",
        currentFaculty
    );


    if (
        currentFaculty.uid !== uid
    ) {

        throw new Error(
            "Faculty UID does not match."
        );

    }


    if (
        currentFaculty.account_status === false
    ) {

        throw new Error(
            "Your faculty account is disabled."
        );

    }


    if (
        currentFaculty.faculty_status === false
    ) {

        throw new Error(
            "Your faculty account is inactive."
        );

    }


    displayFacultyProfile();

}


/* =====================================================
   DISPLAY FACULTY PROFILE
====================================================== */

function displayFacultyProfile() {

    const name =
        currentFaculty.name ||
        currentUser.displayName ||
        "Faculty";


    const facultyId =
        currentFaculty.facultyId ||
        "Not available";


    const email =
        currentFaculty.email ||
        currentUser.email ||
        "Not available";


    const department =
        currentFaculty.department ||
        "Not specified";


    const designation =
        currentFaculty.designation ||
        "Faculty";


    const profileImg =
        currentFaculty.profileImg;


    const subjects =
        Array.isArray(
            currentFaculty.subjects
        )
            ? currentFaculty.subjects
            : [];


    const initials =
        getInitials(name);


    /* =========================================
       HERO
    ========================================== */

    document.getElementById(
        "facultyName"
    ).textContent =
        name;


    document.getElementById(
        "facultyDesignation"
    ).textContent =
        designation;


    document.getElementById(
        "facultyId"
    ).textContent =
        facultyId;


    /* =========================================
       NAVBAR
    ========================================== */

    document.getElementById(
        "navAvatar"
    ).textContent =
        initials;


    document.getElementById(
        "menuAvatar"
    ).textContent =
        initials;


    document.getElementById(
        "menuFacultyName"
    ).textContent =
        name;


    /* =========================================
       PERSONAL INFORMATION
    ========================================== */

    document.getElementById(
        "displayName"
    ).textContent =
        name;


    document.getElementById(
        "displayFacultyId"
    ).textContent =
        facultyId;


    document.getElementById(
        "displayEmail"
    ).textContent =
        email;


    document.getElementById(
        "displayDepartment"
    ).textContent =
        department;


    document.getElementById(
        "displayDesignation"
    ).textContent =
        designation;


    document.getElementById(
        "displayProfileImg"
    ).textContent =
        profileImg &&
        profileImg !== "null"
            ? profileImg
            : "Not set";


    /* =========================================
       PROFESSIONAL INFORMATION
    ========================================== */

    document.getElementById(
        "professionalDepartment"
    ).textContent =
        department;


    document.getElementById(
        "professionalDesignation"
    ).textContent =
        designation;


    renderSubjects(
        subjects
    );


    /* =========================================
       ACCOUNT STATUS
    ========================================== */

    const accountActive =
        currentFaculty.account_status !== false;


    const approved =
        currentFaculty.isApproved === true;


    document.getElementById(
        "accountStatus"
    ).textContent =
        accountActive
            ? "Active"
            : "Inactive";


    document.getElementById(
        "approvalStatus"
    ).textContent =
        approved
            ? "Approved"
            : "Pending";


    document.getElementById(
        "statusText"
    ).textContent =
        accountActive
            ? "Active Faculty"
            : "Inactive Faculty";


    document.getElementById(
        "statusDot"
    ).style.background =
        accountActive
            ? "#16a34a"
            : "#dc2626";


    /* =========================================
       MEMBER SINCE
    ========================================== */

    const createdAt =
        currentFaculty.createdAt;


    if (
        createdAt &&
        typeof createdAt.toDate === "function"
    ) {

        document.getElementById(
            "memberSince"
        ).textContent =
            createdAt
                .toDate()
                .toLocaleDateString(
                    "en-IN",
                    {
                        month:
                            "long",
                        year:
                            "numeric"
                    }
                );

    } else {

        document.getElementById(
            "memberSince"
        ).textContent =
            "Not available";

    }


    /* =========================================
       UID
    ========================================== */

    document.getElementById(
        "uidValue"
    ).textContent =
        currentUser.uid;


    /* =========================================
       PROFILE IMAGE
    ========================================== */

    setProfileImage(
        profileImg,
        initials
    );

}


/* =====================================================
   PROFILE IMAGE
====================================================== */

function setProfileImage(
    imageUrl,
    initials
) {

    const image =
        document.getElementById(
            "profileImage"
        );


    const placeholder =
        document.getElementById(
            "profilePlaceholder"
        );


    if (
        imageUrl &&
        imageUrl !== "null"
    ) {

        image.src =
            imageUrl;


        image.onload =
            () => {

                image.style.display =
                    "block";

                placeholder.style.display =
                    "none";

            };


        image.onerror =
            () => {

                image.style.display =
                    "none";

                placeholder.style.display =
                    "flex";

                placeholder.textContent =
                    initials;

            };

    } else {

        image.style.display =
            "none";

        placeholder.style.display =
            "flex";

        placeholder.textContent =
            initials;

    }

}


/* =====================================================
   RENDER SUBJECTS
====================================================== */

function renderSubjects(
    subjects
) {

    const container =
        document.getElementById(
            "subjectsContainer"
        );


    container.innerHTML =
        "";


    if (
        !subjects ||
        subjects.length === 0
    ) {

        const empty =
            document.createElement(
                "span"
            );


        empty.className =
            "empty-subject";


        empty.textContent =
            "No subjects added";


        container.appendChild(
            empty
        );


        return;

    }


    subjects.forEach(
        subject => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "subject-tag";


            tag.textContent =
                subject;


            container.appendChild(
                tag
            );

        }
    );

}


/* =====================================================
   EDIT PERSONAL INFORMATION
====================================================== */

document
    .getElementById(
        "editPersonalButton"
    )
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "displayName"
            ).hidden =
                true;


            document.getElementById(
                "nameInput"
            ).hidden =
                false;


            document.getElementById(
                "nameInput"
            ).value =
                currentFaculty.name || "";


            document.getElementById(
                "displayDesignation"
            ).hidden =
                true;


            document.getElementById(
                "designationInput"
            ).hidden =
                false;


            document.getElementById(
                "designationInput"
            ).value =
                currentFaculty.designation || "";


            document.getElementById(
                "displayProfileImg"
            ).hidden =
                true;


            document.getElementById(
                "profileImgInput"
            ).hidden =
                false;


            document.getElementById(
                "profileImgInput"
            ).value =
                currentFaculty.profileImg &&
                currentFaculty.profileImg !== "null"
                    ? currentFaculty.profileImg
                    : "";


            document.getElementById(
                "personalActions"
            ).hidden =
                false;

        }
    );


/* =====================================================
   CANCEL PERSONAL EDIT
====================================================== */

document
    .getElementById(
        "cancelPersonalButton"
    )
    .addEventListener(
        "click",
        () => {

            closePersonalEditor();

        }
    );


function closePersonalEditor() {

    document.getElementById(
        "displayName"
    ).hidden =
        false;


    document.getElementById(
        "nameInput"
    ).hidden =
        true;


    document.getElementById(
        "displayDesignation"
    ).hidden =
        false;


    document.getElementById(
        "designationInput"
    ).hidden =
        true;


    document.getElementById(
        "displayProfileImg"
    ).hidden =
        false;


    document.getElementById(
        "profileImgInput"
    ).hidden =
        true;


    document.getElementById(
        "personalActions"
    ).hidden =
        true;

}


/* =====================================================
   SAVE PERSONAL INFORMATION
====================================================== */

document
    .getElementById(
        "savePersonalButton"
    )
    .addEventListener(
        "click",
        async () => {

            const name =
                document.getElementById(
                    "nameInput"
                ).value.trim();


            const designation =
                document.getElementById(
                    "designationInput"
                ).value.trim();


            const profileImg =
                document.getElementById(
                    "profileImgInput"
                ).value.trim();


            if (!name) {

                showToast(
                    "Faculty name cannot be empty.",
                    false
                );

                return;

            }


            if (!designation) {

                showToast(
                    "Please select a designation.",
                    false
                );

                return;

            }


            setLoading(
                true,
                "Saving profile..."
            );


            try {

                const facultyRef =
                    doc(
                        db,
                        "faculty",
                        currentFacultyDocumentId
                    );


                await updateDoc(
                    facultyRef,
                    {

                        name:
                            name,

                        designation:
                            designation,

                        profileImg:
                            profileImg ||
                            "null"

                    }
                );


                await updateProfile(
                    currentUser,
                    {
                        displayName:
                            name
                    }
                );


                currentFaculty.name =
                    name;


                currentFaculty.designation =
                    designation;


                currentFaculty.profileImg =
                    profileImg ||
                    "null";


                displayFacultyProfile();


                closePersonalEditor();


                showToast(
                    "Profile updated successfully.",
                    true
                );


            } catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );


                showToast(
                    "Unable to update profile. Please try again.",
                    false
                );

            } finally {

                setLoading(
                    false
                );

            }

        }
    );


/* =====================================================
   SUBJECT EDITOR
====================================================== */

document
    .getElementById(
        "editSubjectsButton"
    )
    .addEventListener(
        "click",
        () => {

            editableSubjects =
                Array.isArray(
                    currentFaculty.subjects
                )
                    ? [
                        ...currentFaculty.subjects
                    ]
                    : [];


            renderEditableSubjects();


            document.getElementById(
                "subjectsEditor"
            ).hidden =
                false;

        }
    );


/* =====================================================
   RENDER EDITABLE SUBJECTS
====================================================== */

function renderEditableSubjects() {

    const container =
        document.getElementById(
            "editableSubjects"
        );


    container.innerHTML =
        "";


    editableSubjects.forEach(
        (
            subject,
            index
        ) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "editable-subject";


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                subject;


            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "remove-subject";


            remove.textContent =
                "×";


            remove.addEventListener(
                "click",
                () => {

                    editableSubjects.splice(
                        index,
                        1
                    );


                    renderEditableSubjects();

                }
            );


            item.appendChild(
                text
            );


            item.appendChild(
                remove
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   ADD SUBJECT
====================================================== */

document
    .getElementById(
        "addSubjectButton"
    )
    .addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "subjectInput"
                );


            const value =
                input.value.trim();


            if (!value) {

                return;

            }


            const exists =
                editableSubjects.some(
                    subject =>
                        subject.toLowerCase() ===
                        value.toLowerCase()
                );


            if (exists) {

                showToast(
                    "This subject already exists.",
                    false
                );

                return;

            }


            editableSubjects.push(
                value
            );


            input.value =
                "";


            renderEditableSubjects();

        }
    );


/* =====================================================
   ENTER KEY FOR SUBJECT
====================================================== */

document
    .getElementById(
        "subjectInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                document
                    .getElementById(
                        "addSubjectButton"
                    )
                    .click();

            }

        }
    );


/* =====================================================
   CANCEL SUBJECT EDIT
====================================================== */

document
    .getElementById(
        "cancelSubjectsButton"
    )
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "subjectsEditor"
            ).hidden =
                true;

        }
    );


/* =====================================================
   SAVE SUBJECTS
====================================================== */

document
    .getElementById(
        "saveSubjectsButton"
    )
    .addEventListener(
        "click",
        async () => {

            setLoading(
                true,
                "Saving subjects..."
            );


            try {

                const facultyRef =
                    doc(
                        db,
                        "faculty",
                        currentFacultyDocumentId
                    );


                await updateDoc(
                    facultyRef,
                    {

                        subjects:
                            editableSubjects

                    }
                );


                currentFaculty.subjects =
                    [
                        ...editableSubjects
                    ];


                renderSubjects(
                    currentFaculty.subjects
                );


                document.getElementById(
                    "subjectsEditor"
                ).hidden =
                    true;


                showToast(
                    "Subjects updated successfully.",
                    true
                );


            } catch (error) {

                console.error(
                    "Subject update error:",
                    error
                );


                showToast(
                    "Unable to update subjects.",
                    false
                );

            } finally {

                setLoading(
                    false
                );

            }

        }
    );


/* =====================================================
   COPY UID
====================================================== */

document
    .getElementById(
        "copyUidButton"
    )
    .addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    currentUser.uid
                );


                showToast(
                    "UID copied to clipboard.",
                    true
                );


            } catch (error) {

                console.error(
                    "Copy UID error:",
                    error
                );

                showToast(
                    "Unable to copy UID.",
                    false
                );

            }

        }
    );


/* =====================================================
   LOGOUT
====================================================== */

async function logout() {

    try {

        setLoading(
            true,
            "Signing out..."
        );


        await signOut(
            auth
        );


        window.location.href =
            "../login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        setLoading(
            false
        );


        showToast(
            "Unable to logout.",
            false
        );

    }

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}


if (pageLogoutButton) {

    pageLogoutButton.addEventListener(
        "click",
        logout
    );

}


/* =====================================================
   NOTIFICATIONS
====================================================== */

if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "notifications.html";

        }
    );

}


/* =====================================================
   AUTHENTICATION
====================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }


        currentUser =
            user;


        try {

            setLoading(
                true,
                "Loading faculty profile..."
            );


            await loadFaculty(
                user.uid
            );


        } catch (error) {

            console.error(
                "Profile initialization error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load faculty profile.",
                false
            );


            setTimeout(
                async () => {

                    await signOut(
                        auth
                    );

                    window.location.href =
                        "../login.html";

                },
                2000
            );


        } finally {

            setLoading(
                false
            );

        }

    }
);