import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

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


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",
    authDomain: "deptconnect-8b81c.firebaseapp.com",
    projectId: "deptconnect-8b81c",
    storageBucket: "deptconnect-8b81c.firebasestorage.app",
    messagingSenderId: "916956737819",
    appId: "1:916956737819:web:8fc9920e834ac99e66e3be",
    measurementId: "G-2B4VN12YW5"
};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


// =====================================================
// DOM ELEMENTS
// =====================================================

const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const studentList = document.getElementById("studentList");

const pendingCount = document.getElementById("pendingCount");
const departmentCount = document.getElementById("departmentCount");

const departmentText = document.getElementById("departmentText");
const facultyName = document.getElementById("facultyName");
const facultyId = document.getElementById("facultyId");

const refreshButton = document.getElementById("refreshButton");


// =====================================================
// MODAL ELEMENTS
// =====================================================

const studentModal = document.getElementById("studentModal");
const closeModal = document.getElementById("closeModal");

const modalName = document.getElementById("modalName");
const modalStudentId = document.getElementById("modalStudentId");
const modalEmail = document.getElementById("modalEmail");
const modalDepartment = document.getElementById("modalDepartment");
const modalProgramme = document.getElementById("modalProgramme");
const modalSemester = document.getElementById("modalSemester");
const modalBatch = document.getElementById("modalBatch");
const modalGender = document.getElementById("modalGender");
const modalAvatar = document.getElementById("modalAvatar");

const modalApprove = document.getElementById("modalApprove");
const modalReject = document.getElementById("modalReject");


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let currentFaculty = null;
let selectedStudent = null;


// =====================================================
// TOAST
// =====================================================

function showToast(message, type = "success") {

    const oldToast = document.querySelector(".toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3000);
}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        showLoading(true);

        await loadFaculty(user.uid);

        await loadPendingStudents();

        showLoading(false);

    } catch (error) {

        console.error("Authentication / loading error:", error);

        showLoading(false);

        showToast(
            "Unable to load approval data.",
            "error"
        );
    }
});


// =====================================================
// LOAD FACULTY
// =====================================================

async function loadFaculty(uid) {

    try {

        const facultyQuery = query(
            collection(db, "faculty"),
            where("uid", "==", uid)
        );

        const facultySnapshot = await getDocs(facultyQuery);

        if (facultySnapshot.empty) {

            console.error("Faculty document not found.");

            showToast(
                "Faculty profile not found.",
                "error"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);

            return;
        }

        const facultyDoc = facultySnapshot.docs[0];

        currentFaculty = {
            id: facultyDoc.id,
            ...facultyDoc.data()
        };


        // Verify UID
        if (currentFaculty.uid !== uid) {

            throw new Error(
                "Faculty UID verification failed."
            );
        }


        // Check faculty status
        if (currentFaculty.faculty_status === false) {

            showToast(
                "Your faculty account is inactive.",
                "error"
            );

            return;
        }


        // Department required
        if (!currentFaculty.department) {

            showToast(
                "Faculty department is not configured.",
                "error"
            );

            return;
        }


        // Update UI

        if (facultyName) {
            facultyName.textContent =
                currentFaculty.name || "Faculty";
        }

        if (facultyId) {
            facultyId.textContent =
                currentFaculty.facultyId || "";
        }

        if (departmentText) {
            departmentText.textContent =
                currentFaculty.department;
        }

    } catch (error) {

        console.error(
            "Error loading faculty:",
            error
        );

        throw error;
    }
}


// =====================================================
// LOAD PENDING STUDENTS
// =====================================================

async function loadPendingStudents() {

    if (!currentFaculty) {
        return;
    }

    try {

        showLoading(true);

        const facultyDepartment =
            currentFaculty.department;


        // IMPORTANT:
        // Only isApproved is used to identify pending students.

        const studentsQuery = query(
            collection(db, "students"),
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
            await getDocs(studentsQuery);


        const students = [];


        snapshot.forEach((studentDoc) => {

            const data = studentDoc.data();


            // Additional client-side safety check
            if (data.isApproved === false) {

                students.push({
                    id: studentDoc.id,
                    ...data
                });
            }

        });


        // Sort by createdAt
        students.sort((a, b) => {

            const dateA =
                getTimestampValue(a.createdAt);

            const dateB =
                getTimestampValue(b.createdAt);

            return dateA - dateB;
        });


        // Update counters

        if (pendingCount) {
            pendingCount.textContent =
                students.length;
        }

        if (departmentCount) {
            departmentCount.textContent =
                students.length;
        }


        // Clear existing cards

        studentList.innerHTML = "";


        if (students.length === 0) {

            emptyState.style.display = "flex";
            studentList.style.display = "none";

        } else {

            emptyState.style.display = "none";
            studentList.style.display = "grid";


            students.forEach((student) => {

                const card =
                    createStudentCard(student);

                studentList.appendChild(card);
            });
        }


    } catch (error) {

        console.error(
            "Error loading students:",
            error
        );

        showToast(
            "Failed to load pending students.",
            "error"
        );

    } finally {

        showLoading(false);
    }
}


// =====================================================
// CREATE STUDENT CARD
// =====================================================

function createStudentCard(student) {

    const card =
        document.createElement("div");

    card.className = "student-card";


    const initials =
        getInitials(student.name);


    const profileImage =
        student.profileImg ||
        "";


    card.innerHTML = `

        <div class="student-card-header">

            <div class="student-avatar">

                ${
                    profileImage
                    ?
                    `<img
                        src="${escapeHTML(profileImage)}"
                        alt="${escapeHTML(student.name || "Student")}"
                        onerror="this.style.display='none'; this.parentElement.querySelector('.avatar-fallback').style.display='flex';"
                    >`
                    :
                    ""
                }

                <span
                    class="avatar-fallback"
                    style="${profileImage ? "display:none;" : "display:flex;"}"
                >
                    ${initials}
                </span>

            </div>


            <div class="student-basic-info">

                <h3>
                    ${escapeHTML(student.name || "Unknown Student")}
                </h3>

                <p>
                    ${escapeHTML(student.studentId || "No Student ID")}
                </p>

            </div>

        </div>


        <div class="student-card-body">

            <div class="student-info-row">

                <span class="label">
                    Email
                </span>

                <span class="value">
                    ${escapeHTML(student.email || "N/A")}
                </span>

            </div>


            <div class="student-info-row">

                <span class="label">
                    Programme
                </span>

                <span class="value">
                    ${escapeHTML(student.programme || "N/A")}
                </span>

            </div>


            <div class="student-info-row">

                <span class="label">
                    Semester
                </span>

                <span class="value">
                    ${escapeHTML(student.semester || "N/A")}
                </span>

            </div>


            <div class="student-info-row">

                <span class="label">
                    Batch
                </span>

                <span class="value">
                    ${escapeHTML(student.batch || "N/A")}
                </span>

            </div>

        </div>


        <div class="student-card-footer">

            <span class="pending-badge">
                Pending Approval
            </span>

            <button
                type="button"
                class="view-student-btn"
            >
                View
            </button>

        </div>

    `;


    const viewButton =
        card.querySelector(".view-student-btn");


    viewButton.addEventListener(
        "click",
        () => {
            openStudentModal(student);
        }
    );


    return card;
}


// =====================================================
// OPEN STUDENT MODAL
// =====================================================

function openStudentModal(student) {

    selectedStudent = student;


    if (modalName) {
        modalName.textContent =
            student.name || "N/A";
    }

    if (modalStudentId) {
        modalStudentId.textContent =
            student.studentId || "N/A";
    }

    if (modalEmail) {
        modalEmail.textContent =
            student.email || "N/A";
    }

    if (modalDepartment) {
        modalDepartment.textContent =
            student.department || "N/A";
    }

    if (modalProgramme) {
        modalProgramme.textContent =
            student.programme || "N/A";
    }

    if (modalSemester) {
        modalSemester.textContent =
            student.semester ?? "N/A";
    }

    if (modalBatch) {
        modalBatch.textContent =
            student.batch || "N/A";
    }

    if (modalGender) {
        modalGender.textContent =
            student.gender || "N/A";
    }


    // Profile image

    if (modalAvatar) {

        if (student.profileImg) {

            modalAvatar.src =
                student.profileImg;

            modalAvatar.style.display =
                "block";

        } else {

            modalAvatar.src = "";

            modalAvatar.style.display =
                "none";
        }
    }


    // IMPORTANT:
    // Only this adds the active class.

    studentModal.classList.add("active");

    // Prevent page behind modal from scrolling
    document.body.classList.add("modal-open");
}


// =====================================================
// CLOSE STUDENT MODAL
// =====================================================

function closeStudentModal() {

    if (!studentModal) {
        return;
    }


    // IMPORTANT:
    // Remove active class.

    studentModal.classList.remove("active");


    selectedStudent = null;


    // Restore page scrolling

    document.body.classList.remove(
        "modal-open"
    );
}


// =====================================================
// CLOSE BUTTON
// =====================================================

if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeStudentModal
    );
}


// =====================================================
// CLOSE WHEN CLICKING BACKDROP
// =====================================================

if (studentModal) {

    studentModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === studentModal
            ) {

                closeStudentModal();
            }
        }
    );
}


// =====================================================
// ESC KEY
// =====================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            studentModal &&
            studentModal.classList.contains("active")
        ) {

            closeStudentModal();
        }
    }
);


// =====================================================
// APPROVE STUDENT
// =====================================================

if (modalApprove) {

    modalApprove.addEventListener(
        "click",
        async () => {

            if (!selectedStudent) {

                showToast(
                    "No student selected.",
                    "error"
                );

                return;
            }


            const student =
                selectedStudent;


            try {

                modalApprove.disabled = true;

                modalReject.disabled = true;


                await updateDoc(
                    doc(
                        db,
                        "students",
                        student.id
                    ),
                    {

                        isApproved: true,

                        account_status: true,

                        student_status: true,

                        approvedBy:
                            currentFaculty.uid,

                        approvedByName:
                            currentFaculty.name || "",

                        approvedAt:
                            serverTimestamp()
                    }
                );


                closeStudentModal();


                showToast(
                    `${student.name} has been approved successfully.`,
                    "success"
                );


                await loadPendingStudents();


            } catch (error) {

                console.error(
                    "Approval error:",
                    error
                );


                showToast(
                    "Failed to approve student.",
                    "error"
                );

            } finally {

                modalApprove.disabled =
                    false;

                modalReject.disabled =
                    false;
            }
        }
    );
}


// =====================================================
// REJECT STUDENT
// =====================================================

if (modalReject) {

    modalReject.addEventListener(
        "click",
        async () => {

            if (!selectedStudent) {

                showToast(
                    "No student selected.",
                    "error"
                );

                return;
            }


            const student =
                selectedStudent;


            const confirmation =
                confirm(
                    `Are you sure you want to reject ${student.name}?`
                );


            if (!confirmation) {
                return;
            }


            try {

                modalReject.disabled =
                    true;

                modalApprove.disabled =
                    true;


                await updateDoc(
                    doc(
                        db,
                        "students",
                        student.id
                    ),
                    {

                        isApproved: false,

                        account_status: false,

                        student_status: false,

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
                    `${student.name} has been rejected.`,
                    "success"
                );


                await loadPendingStudents();


            } catch (error) {

                console.error(
                    "Rejection error:",
                    error
                );


                showToast(
                    "Failed to reject student.",
                    "error"
                );

            } finally {

                modalReject.disabled =
                    false;

                modalApprove.disabled =
                    false;
            }
        }
    );
}


// =====================================================
// REFRESH
// =====================================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            try {

                refreshButton.disabled =
                    true;

                await loadPendingStudents();

            } finally {

                refreshButton.disabled =
                    false;
            }
        }
    );
}


// =====================================================
// LOADING
// =====================================================

function showLoading(show) {

    if (!loading) {
        return;
    }

    loading.style.display =
        show ? "flex" : "none";
}


// =====================================================
// GET INITIALS
// =====================================================

function getInitials(name) {

    if (!name) {
        return "S";
    }


    const parts =
        name.trim().split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


// =====================================================
// TIMESTAMP HELPER
// =====================================================

function getTimestampValue(timestamp) {

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
        timestamp.seconds !== undefined
    ) {

        return timestamp.seconds * 1000;
    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();
    }


    return 0;
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}