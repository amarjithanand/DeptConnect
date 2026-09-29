/* =========================================
   FIREBASE IMPORTS
========================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
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
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================
   DOM ELEMENTS
========================================= */

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const studentList =
    document.getElementById("studentList");

const pendingCount =
    document.getElementById("pendingCount");

const departmentCount =
    document.getElementById("departmentCount");

const departmentText =
    document.getElementById("departmentText");

const facultyName =
    document.getElementById("facultyName");

const facultyId =
    document.getElementById("facultyId");

const refreshButton =
    document.getElementById("refreshButton");


/* =========================================
   MODAL ELEMENTS
========================================= */

const studentModal =
    document.getElementById("studentModal");

const closeModal =
    document.getElementById("closeModal");

const modalName =
    document.getElementById("modalName");

const modalStudentId =
    document.getElementById("modalStudentId");

const modalEmail =
    document.getElementById("modalEmail");

const modalDepartment =
    document.getElementById("modalDepartment");

const modalProgramme =
    document.getElementById("modalProgramme");

const modalSemester =
    document.getElementById("modalSemester");

const modalBatch =
    document.getElementById("modalBatch");

const modalGender =
    document.getElementById("modalGender");

const modalAvatar =
    document.getElementById("modalAvatar");

const modalApprove =
    document.getElementById("modalApprove");

const modalReject =
    document.getElementById("modalReject");


/* =========================================
   VARIABLES
========================================= */

let currentFaculty = null;

let selectedStudent = null;


/* =========================================
   TOAST
========================================= */

function showToast(
    message,
    success = false
) {

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById("toastMessage");


    toastMessage.textContent =
        message;


    toast.style.background =
        success
            ? "#166534"
            : "#b91c1c";


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);

}


/* =========================================
   AUTH CHECK
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        try {

            await loadFaculty(user.uid);

            await loadPendingStudents();

        } catch (error) {

            console.error(
                "Initialization error:",
                error
            );

            showToast(
                "Unable to load student approvals."
            );

        }

    }
);


/* =========================================
   LOAD FACULTY
========================================= */

async function loadFaculty(uid) {

    /*
     * Faculty document should be:
     *
     * faculty/{facultyUID}
     */

    const facultyRef =
        doc(
            db,
            "faculty",
            uid
        );


    const facultySnap =
        await getDoc(facultyRef);


    if (!facultySnap.exists()) {

        showToast(
            "Faculty profile not found."
        );

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 2000);

        throw new Error(
            "Faculty profile not found."
        );
    }


    currentFaculty =
        facultySnap.data();


    /* =====================================
       VERIFY FACULTY
    ===================================== */

    if (
        currentFaculty.uid !== uid
    ) {

        throw new Error(
            "Invalid faculty account."
        );
    }


    if (
        currentFaculty.faculty_status === false
    ) {

        showToast(
            "Your faculty account is inactive."
        );

        throw new Error(
            "Inactive faculty account."
        );
    }


    /* =====================================
       DISPLAY FACULTY INFO
    ===================================== */

    facultyName.textContent =
        currentFaculty.name ||
        "Faculty";


    facultyId.textContent =
        currentFaculty.facultyId ||
        uid;


    const department =
        currentFaculty.department;


    departmentText.textContent =
        `Department: ${department || "Not specified"}`;


    departmentCount.textContent =
        department || "—";

}


/* =========================================
   LOAD PENDING STUDENTS
========================================= */

async function loadPendingStudents() {

    if (!currentFaculty) {
        return;
    }


    loading.hidden = false;

    emptyState.hidden = true;

    studentList.hidden = true;


    studentList.innerHTML = "";


    const department =
        currentFaculty.department;


    if (!department) {

        loading.hidden = true;

        emptyState.hidden = false;

        emptyState.querySelector("h3")
            .textContent =
            "Department not configured.";

        return;
    }


    try {


        /* =================================
           QUERY PENDING STUDENTS
        ================================= */

        const studentsRef =
            collection(
                db,
                "students"
            );


        const studentQuery =
            query(
                studentsRef,

                where(
                    "department",
                    "==",
                    department
                ),

                where(
                    "isApproved",
                    "==",
                    false
                )
            );


        const snapshot =
            await getDocs(
                studentQuery
            );


        /* =================================
           FILTER PENDING
        ================================= */

        const students = [];


        snapshot.forEach(
            (studentDoc) => {

                const data =
                    studentDoc.data();


                /*
                 * Extra client-side protection:
                 * only pending accounts.
                 */

                if (
                    data.account_status === false &&
                    data.student_status === false
                ) {

                    students.push({

                        id:
                            studentDoc.id,

                        ...data

                    });

                }

            }
        );


        loading.hidden = true;


        pendingCount.textContent =
            students.length;


        /* =================================
           EMPTY
        ================================= */

        if (
            students.length === 0
        ) {

            emptyState.hidden = false;

            studentList.hidden = true;

            return;
        }


        /* =================================
           DISPLAY
        ================================= */

        students.forEach(
            (student) => {

                createStudentCard(
                    student
                );

            }
        );


        studentList.hidden = false;


    } catch (error) {

        console.error(
            "Error loading students:",
            error
        );


        loading.hidden = true;

        emptyState.hidden = false;

        emptyState.querySelector("h3")
            .textContent =
            "Unable to load registrations.";


        showToast(
            "Could not load pending students."
        );

    }

}


/* =========================================
   CREATE STUDENT CARD
========================================= */

function createStudentCard(student) {

    const card =
        document.createElement("div");


    card.className =
        "student-card";


    /* =====================================
       AVATAR
    ===================================== */

    let avatarHTML;


    if (
        student.profileImg
    ) {

        avatarHTML = `
            <img
                src="${escapeHTML(student.profileImg)}"
                alt="Student"
                onerror="this.style.display='none'"
            >
        `;

    } else {

        avatarHTML =
            getInitials(
                student.name
            );

    }


    /* =====================================
       CARD
    ===================================== */

    card.innerHTML = `

        <div class="student-main">

            <div class="student-avatar">

                ${avatarHTML}

            </div>


            <div class="student-info">

                <h3>
                    ${escapeHTML(student.name || "Unknown Student")}
                </h3>

                <p>
                    ${escapeHTML(student.email || "")}
                </p>


                <div class="student-meta">

                    <span class="badge">
                        ${escapeHTML(student.studentId || "No ID")}
                    </span>

                    <span class="badge">
                        ${escapeHTML(student.programme || "")}
                    </span>

                    <span class="badge">
                        Semester ${student.semester || "-"}
                    </span>

                    <span class="badge pending-badge">
                        Pending
                    </span>

                </div>

            </div>

        </div>


        <div class="student-actions">

            <button
                class="view-button"
                data-action="view"
            >
                View
            </button>

            <button
                class="reject-button"
                data-action="reject"
            >
                Reject
            </button>

            <button
                class="approve-button"
                data-action="approve"
            >
                Approve
            </button>

        </div>

    `;


    /* =====================================
       BUTTON EVENTS
    ===================================== */

    card
        .querySelector(
            '[data-action="view"]'
        )
        .addEventListener(
            "click",
            () => {

                openStudentModal(
                    student
                );

            }
        );


    card
        .querySelector(
            '[data-action="approve"]'
        )
        .addEventListener(
            "click",
            () => {

                approveStudent(
                    student
                );

            }
        );


    card
        .querySelector(
            '[data-action="reject"]'
        )
        .addEventListener(
            "click",
            () => {

                rejectStudent(
                    student
                );

            }
        );


    studentList.appendChild(
        card
    );

}


/* =========================================
   OPEN MODAL
========================================= */

function openStudentModal(student) {

    selectedStudent =
        student;


    modalName.textContent =
        student.name || "Student";


    modalStudentId.textContent =
        student.studentId || "No Student ID";


    modalEmail.textContent =
        student.email || "—";


    modalDepartment.textContent =
        student.department || "—";


    modalProgramme.textContent =
        student.programme || "—";


    modalSemester.textContent =
        student.semester || "—";


    modalBatch.textContent =
        student.batch || "—";


    modalGender.textContent =
        student.gender || "—";


    if (
        student.profileImg
    ) {

        modalAvatar.innerHTML = `
            <img
                src="${escapeHTML(student.profileImg)}"
                alt="Student"
            >
        `;

    } else {

        modalAvatar.textContent =
            getInitials(
                student.name
            );

    }


    studentModal.hidden =
        false;

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeStudentModal() {

    studentModal.hidden =
        true;

    selectedStudent =
        null;

}


closeModal.addEventListener(
    "click",
    closeStudentModal
);


studentModal
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closeStudentModal
);


/* =========================================
   MODAL APPROVE
========================================= */

modalApprove.addEventListener(
    "click",
    async () => {

        if (
            !selectedStudent
        ) {
            return;
        }


        await approveStudent(
            selectedStudent
        );

    }
);


/* =========================================
   MODAL REJECT
========================================= */

modalReject.addEventListener(
    "click",
    async () => {

        if (
            !selectedStudent
        ) {
            return;
        }


        await rejectStudent(
            selectedStudent
        );

    }
);


/* =========================================
   APPROVE STUDENT
========================================= */

async function approveStudent(student) {

    const confirmed =
        confirm(
            `Approve ${student.name} as a student?`
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * Extra department verification.
         */

        if (
            student.department !==
            currentFaculty.department
        ) {

            showToast(
                "You can only approve students from your department."
            );

            return;
        }


        const studentRef =
            doc(
                db,
                "students",
                student.id
            );


        /* =================================
           UPDATE APPROVAL STATUS
        ================================= */

        await updateDoc(
            studentRef,
            {

                isApproved:
                    true,

                account_status:
                    true,

                student_status:
                    true,

                approvedBy:
                    currentFaculty.uid,

                approvedByName:
                    currentFaculty.name || "",

                approvedAt:
                    serverTimestamp()

            }
        );


        /* =================================
           CLOSE MODAL
        ================================= */

        closeStudentModal();


        showToast(
            `${student.name} has been approved successfully.`,
            true
        );


        /* =================================
           REFRESH
        ================================= */

        await loadPendingStudents();


    } catch (error) {

        console.error(
            "Approval error:",
            error
        );


        showToast(
            "Unable to approve this student."
        );

    }

}


/* =========================================
   REJECT STUDENT
========================================= */

async function rejectStudent(student) {

    const confirmed =
        confirm(
            `Reject the registration of ${student.name}?`
        );


    if (!confirmed) {
        return;
    }


    try {


        /* =================================
           DEPARTMENT CHECK
        ================================= */

        if (
            student.department !==
            currentFaculty.department
        ) {

            showToast(
                "You can only reject students from your department."
            );

            return;
        }


        const studentRef =
            doc(
                db,
                "students",
                student.id
            );


        /* =================================
           UPDATE STATUS
        ================================= */

        await updateDoc(
            studentRef,
            {

                isApproved:
                    false,

                account_status:
                    false,

                student_status:
                    false,

                registration_status:
                    "rejected",

                rejectedBy:
                    currentFaculty.uid,

                rejectedByName:
                    currentFaculty.name || "",

                rejectedAt:
                    serverTimestamp()

            }
        );


        closeStudentModal();


        showToast(
            `${student.name}'s registration has been rejected.`,
            true
        );


        await loadPendingStudents();


    } catch (error) {

        console.error(
            "Rejection error:",
            error
        );


        showToast(
            "Unable to reject this registration."
        );

    }

}


/* =========================================
   REFRESH
========================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        await loadPendingStudents();

    }
);


/* =========================================
   GET INITIALS
========================================= */

function getInitials(name) {

    if (!name) {
        return "S";
    }


    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");

}


/* =========================================
   BASIC HTML ESCAPE
========================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}