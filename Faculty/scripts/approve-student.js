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
    collection,
    query,
    where,
    getDocs,
    doc,
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
   INITIALIZE FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


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
   GLOBAL VARIABLES
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


    if (!toast || !toastMessage) {

        alert(message);

        return;

    }


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

    }, 3500);

}


/* =========================================
   AUTH STATE
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
            "Logged in faculty UID:",
            user.uid
        );


        try {

            /*
             * Load faculty profile
             * using uid FIELD.
             */

            await loadFaculty(
                user.uid
            );


            /*
             * Load pending students
             * from same department.
             */

            await loadPendingStudents();


        } catch (error) {

            console.error(
                "Page initialization error:",
                error
            );

            loading.hidden = true;

            showToast(
                "Unable to load faculty/student details."
            );

        }

    }
);


/* =========================================
   LOAD FACULTY
========================================= */

async function loadFaculty(uid) {

    console.log(
        "Searching faculty with UID:",
        uid
    );


    /* =====================================
       FIND FACULTY DOCUMENT
       USING uid FIELD
    ===================================== */

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


    /* =====================================
       FACULTY NOT FOUND
    ===================================== */

    if (
        facultySnapshot.empty
    ) {

        console.error(
            "Faculty document not found for UID:",
            uid
        );


        throw new Error(
            "Faculty profile not found."
        );

    }


    /* =====================================
       GET FACULTY DOCUMENT
    ===================================== */

    const facultyDocument =
        facultySnapshot.docs[0];


    currentFaculty =
        facultyDocument.data();


    console.log(
        "Faculty data:",
        currentFaculty
    );


    /* =====================================
       VERIFY UID
    ===================================== */

    if (
        currentFaculty.uid !== uid
    ) {

        throw new Error(
            "Faculty UID does not match."
        );

    }


    /* =====================================
       CHECK FACULTY STATUS
    ===================================== */

    if (
        currentFaculty.faculty_status === false
    ) {

        throw new Error(
            "Faculty account is inactive."
        );

    }


    /* =====================================
       CHECK DEPARTMENT
    ===================================== */

    if (
        !currentFaculty.department
    ) {

        throw new Error(
            "Faculty department is missing."
        );

    }


    /* =====================================
       DISPLAY FACULTY INFORMATION
    ===================================== */

    facultyName.textContent =
        currentFaculty.name ||
        "Faculty";


    facultyId.textContent =
        currentFaculty.facultyId ||
        uid;


    departmentText.textContent =
        `Department: ${currentFaculty.department}`;


    departmentCount.textContent =
        currentFaculty.department;


    console.log(
        "Faculty department:",
        currentFaculty.department
    );

}


/* =========================================
   LOAD PENDING STUDENTS
========================================= */

async function loadPendingStudents() {

    if (!currentFaculty) {

        console.error(
            "Faculty data is not loaded."
        );

        return;

    }


    /* =====================================
       RESET UI
    ===================================== */

    loading.hidden = false;

    emptyState.hidden = true;

    studentList.hidden = true;

    studentList.innerHTML = "";


    /* =====================================
       FACULTY DEPARTMENT
    ===================================== */

    const facultyDepartment =
        currentFaculty.department;


    console.log(
        "Loading students from department:",
        facultyDepartment
    );


    /* =====================================
       QUERY STUDENTS
    ===================================== */

    try {

        const studentsQuery =
            query(
                collection(
                    db,
                    "students"
                ),

                where(
                    "department",
                    "==",
                    facultyDepartment
                ),

                where(
                    "isApproved",
                    "==",
                    false
                )
            );


        const snapshot =
            await getDocs(
                studentsQuery
            );


        console.log(
            "Student documents found:",
            snapshot.size
        );


        const students = [];


        /* =====================================
           FILTER ONLY PENDING STUDENTS
        ===================================== */

        snapshot.forEach(
            (studentDoc) => {

                const data =
                    studentDoc.data();


                console.log(
                    "Student:",
                    studentDoc.id,
                    data
                );


                /*
                 * A student is considered
                 * pending when all three
                 * approval fields are false.
                 */

                if (
                    data.isApproved === false &&
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


        /* =====================================
           SORT BY CREATED TIME
        ===================================== */

        students.sort(
            (a, b) => {

                const timeA =
                    getTimestampValue(
                        a.createdAt
                    );


                const timeB =
                    getTimestampValue(
                        b.createdAt
                    );


                return timeB - timeA;

            }
        );


        /* =====================================
           UPDATE COUNT
        ===================================== */

        pendingCount.textContent =
            students.length;


        loading.hidden = true;


        /* =====================================
           NO STUDENTS
        ===================================== */

        if (
            students.length === 0
        ) {

            emptyState.hidden = false;

            studentList.hidden = true;

            return;

        }


        /* =====================================
           DISPLAY STUDENTS
        ===================================== */

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
            "Error loading pending students:",
            error
        );


        loading.hidden = true;

        emptyState.hidden = false;

        pendingCount.textContent =
            "0";


        showToast(
            "Unable to load student registrations."
        );

    }

}


/* =========================================
   CREATE STUDENT CARD
========================================= */

function createStudentCard(student) {

    const card =
        document.createElement(
            "div"
        );


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
       CARD HTML
    ===================================== */

    card.innerHTML = `

        <div class="student-main">

            <div class="student-avatar">

                ${avatarHTML}

            </div>


            <div class="student-info">

                <h3>
                    ${escapeHTML(
                        student.name ||
                        "Unknown Student"
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        student.email ||
                        ""
                    )}
                </p>


                <div class="student-meta">

                    <span class="badge">

                        ${escapeHTML(
                            student.studentId ||
                            "No ID"
                        )}

                    </span>


                    <span class="badge">

                        ${escapeHTML(
                            student.programme ||
                            ""
                        )}

                    </span>


                    <span class="badge">

                        Semester
                        ${student.semester || "-"}

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
       VIEW BUTTON
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


    /* =====================================
       APPROVE BUTTON
    ===================================== */

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


    /* =====================================
       REJECT BUTTON
    ===================================== */

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
   OPEN STUDENT MODAL
========================================= */

function openStudentModal(student) {

    selectedStudent =
        student;


    modalName.textContent =
        student.name ||
        "Student";


    modalStudentId.textContent =
        student.studentId ||
        "No Student ID";


    modalEmail.textContent =
        student.email ||
        "—";


    modalDepartment.textContent =
        student.department ||
        "—";


    modalProgramme.textContent =
        student.programme ||
        "—";


    modalSemester.textContent =
        student.semester ||
        "—";


    modalBatch.textContent =
        student.batch ||
        "—";


    modalGender.textContent =
        student.gender ||
        "—";


    /* =====================================
       MODAL IMAGE
    ===================================== */

    if (
        student.profileImg
    ) {

        modalAvatar.innerHTML = `

            <img
                src="${escapeHTML(
                    student.profileImg
                )}"
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

    /* =====================================
       VERIFY FACULTY
    ===================================== */

    if (
        !currentFaculty
    ) {

        showToast(
            "Faculty information is unavailable."
        );

        return;

    }


    /* =====================================
       VERIFY DEPARTMENT
    ===================================== */

    if (
        student.department !==
        currentFaculty.department
    ) {

        showToast(
            "You can only approve students from your department."
        );

        return;

    }


    /* =====================================
       CONFIRM
    ===================================== */

    const confirmed =
        confirm(
            `Approve ${student.name} as a student?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const studentRef =
            doc(
                db,
                "students",
                student.id
            );


        /* =================================
           UPDATE STUDENT
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
                    currentFaculty.name ||
                    "",

                approvedAt:
                    serverTimestamp()

            }
        );


        /* =================================
           CLOSE MODAL
        ================================= */

        closeStudentModal();


        /* =================================
           SUCCESS
        ================================= */

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
            "Student approval error:",
            error
        );


        if (
            error.code ===
            "permission-denied"
        ) {

            showToast(
                "Permission denied. Please check your Firestore rules."
            );

        } else {

            showToast(
                "Unable to approve the student."
            );

        }

    }

}


/* =========================================
   REJECT STUDENT
========================================= */

async function rejectStudent(student) {

    /* =====================================
       VERIFY FACULTY
    ===================================== */

    if (
        !currentFaculty
    ) {

        showToast(
            "Faculty information is unavailable."
        );

        return;

    }


    /* =====================================
       VERIFY DEPARTMENT
    ===================================== */

    if (
        student.department !==
        currentFaculty.department
    ) {

        showToast(
            "You can only reject students from your department."
        );

        return;

    }


    /* =====================================
       CONFIRM
    ===================================== */

    const confirmed =
        confirm(
            `Reject the registration of ${student.name}?`
        );


    if (!confirmed) {

        return;

    }


    try {

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
                    currentFaculty.name ||
                    "",

                rejectedAt:
                    serverTimestamp()

            }
        );


        /* =================================
           CLOSE MODAL
        ================================= */

        closeStudentModal();


        /* =================================
           SUCCESS
        ================================= */

        showToast(
            `${student.name}'s registration has been rejected.`,
            true
        );


        /* =================================
           REFRESH
        ================================= */

        await loadPendingStudents();


    } catch (error) {

        console.error(
            "Student rejection error:",
            error
        );


        if (
            error.code ===
            "permission-denied"
        ) {

            showToast(
                "Permission denied. Please check your Firestore rules."
            );

        } else {

            showToast(
                "Unable to reject this registration."
            );

        }

    }

}


/* =========================================
   REFRESH BUTTON
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
   TIMESTAMP VALUE
========================================= */

function getTimestampValue(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp.seconds
    ) {

        return timestamp.seconds * 1000;

    }


    return 0;

}


/* =========================================
   HTML ESCAPE
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