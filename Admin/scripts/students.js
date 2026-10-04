import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ==========================================
// FIREBASE
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDfYZmMD6GpE1I0dLKzt7UG8dBm4TN6Ijg",
    authDomain: "deptconnect-8b81c.firebaseapp.com",
    projectId: "deptconnect-8b81c",
    storageBucket: "deptconnect-8b81c.firebasestorage.app",
    messagingSenderId: "916956737819",
    appId: "1:916956737819:web:8fc9920e834ac99e66e3be",
    measurementId: "G-2B4VN12YW5"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ==========================================
// DOM
// ==========================================

const tableBody =
    document.getElementById("studentsTableBody");

const emptyMessage =
    document.getElementById("emptyMessage");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const departmentFilter =
    document.getElementById("departmentFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const adminEmail =
    document.getElementById("adminEmail");

const modal =
    document.getElementById("studentModal");

const closeModal =
    document.getElementById("closeModal");

const studentDetails =
    document.getElementById("studentDetails");


// ==========================================
// DATA
// ==========================================

let students = [];


// ==========================================
// ADMIN PROTECTION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    try {

        const roleQuery = query(
            collection(db, "role"),
            where("uid", "==", user.uid)
        );

        const roleSnapshot =
            await getDocs(roleQuery);

        let isAdmin = false;

        roleSnapshot.forEach((doc) => {

            if (doc.data().role === "admin") {
                isAdmin = true;
            }

        });

        if (!isAdmin) {

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }

        adminEmail.textContent =
            user.email;

        await loadStudents();

    }

    catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        await signOut(auth);

        window.location.href =
            "login.html";

    }

});


// ==========================================
// LOAD STUDENTS
// ==========================================

async function loadStudents() {

    try {

        tableBody.innerHTML =
            `<tr>
                <td colspan="9" class="loading">
                    Loading students...
                </td>
            </tr>`;

        const snapshot =
            await getDocs(
                collection(db, "students")
            );

        students = [];

        snapshot.forEach((studentDoc) => {

            students.push({

                docId: studentDoc.id,

                ...studentDoc.data()

            });

        });

        populateDepartments();

        updateSummary();

        renderStudents();

    }

    catch (error) {

        console.error(
            "Error loading students:",
            error
        );

        tableBody.innerHTML =
            `<tr>
                <td colspan="9" class="error">
                    Failed to load students.
                </td>
            </tr>`;

    }

}


// ==========================================
// DEPARTMENTS
// ==========================================

function populateDepartments() {

    const departments =
        [...new Set(
            students
                .map(student => student.department)
                .filter(Boolean)
        )]
        .sort();

    departmentFilter.innerHTML =
        `<option value="all">
            All Departments
        </option>`;

    departments.forEach(department => {

        const option =
            document.createElement("option");

        option.value = department;

        option.textContent = department;

        departmentFilter.appendChild(option);

    });

}


// ==========================================
// SUMMARY
// ==========================================

function updateSummary() {

    const total =
        students.length;

    const pending =
        students.filter(
            student =>
                student.isApproved === false
        ).length;

    const approved =
        students.filter(
            student =>
                student.isApproved === true
        ).length;

    const inactive =
        students.filter(
            student =>
                student.account_status === false
        ).length;


    document.getElementById(
        "totalStudents"
    ).textContent = total;

    document.getElementById(
        "pendingStudents"
    ).textContent = pending;

    document.getElementById(
        "approvedStudents"
    ).textContent = approved;

    document.getElementById(
        "inactiveStudents"
    ).textContent = inactive;

}


// ==========================================
// RENDER STUDENTS
// ==========================================

function renderStudents() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        statusFilter.value;

    const department =
        departmentFilter.value;


    const filtered =
        students.filter(student => {

            const matchesSearch =

                !search ||

                (student.name || "")
                    .toLowerCase()
                    .includes(search) ||

                (student.email || "")
                    .toLowerCase()
                    .includes(search) ||

                (student.studentId || "")
                    .toLowerCase()
                    .includes(search);


            let matchesStatus = true;


            if (status === "pending") {

                matchesStatus =
                    student.isApproved === false;

            }

            else if (status === "approved") {

                matchesStatus =
                    student.isApproved === true;

            }

            else if (status === "inactive") {

                matchesStatus =
                    student.account_status === false;

            }


            const matchesDepartment =

                department === "all" ||

                student.department === department;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesDepartment
            );

        });


    tableBody.innerHTML = "";

    emptyMessage.style.display =
        filtered.length === 0
            ? "block"
            : "none";


    filtered.forEach(student => {

        const row =
            document.createElement("tr");


        const approvalStatus =
            student.isApproved === true
                ? `<span class="badge approved">
                    Approved
                   </span>`
                : `<span class="badge pending">
                    Pending
                   </span>`;


        const accountStatus =
            student.account_status === true
                ? `<span class="badge active">
                    Active
                   </span>`
                : `<span class="badge inactive">
                    Inactive
                   </span>`;


        row.innerHTML = `

            <td>${escapeHTML(student.studentId)}</td>

            <td>${escapeHTML(student.name)}</td>

            <td>${escapeHTML(student.email)}</td>

            <td>${escapeHTML(student.department)}</td>

            <td>${escapeHTML(student.programme)}</td>

            <td>${student.semester ?? "-"}</td>

            <td>${accountStatus}</td>

            <td>${approvalStatus}</td>

            <td>

                <div class="actions">

                    <button
                        class="view-btn"
                        data-id="${student.docId}"
                    >
                        View
                    </button>

                    ${
                        student.isApproved === false
                        ?
                        `
                        <button
                            class="approve-btn"
                            data-id="${student.docId}"
                        >
                            Approve
                        </button>

                        <button
                            class="reject-btn"
                            data-id="${student.docId}"
                        >
                            Reject
                        </button>
                        `
                        :
                        `
                        <button
                            class="status-btn"
                            data-id="${student.docId}"
                        >
                            ${
                                student.account_status === true
                                ? "Deactivate"
                                : "Activate"
                            }
                        </button>
                        `
                    }

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


// ==========================================
// VIEW STUDENT
// ==========================================

function showStudent(student) {

    studentDetails.innerHTML = `

        <div class="detail-grid">

            <div>
                <strong>Name</strong>
                <span>${escapeHTML(student.name)}</span>
            </div>

            <div>
                <strong>Student ID</strong>
                <span>${escapeHTML(student.studentId)}</span>
            </div>

            <div>
                <strong>Email</strong>
                <span>${escapeHTML(student.email)}</span>
            </div>

            <div>
                <strong>Department</strong>
                <span>${escapeHTML(student.department)}</span>
            </div>

            <div>
                <strong>Programme</strong>
                <span>${escapeHTML(student.programme)}</span>
            </div>

            <div>
                <strong>Batch</strong>
                <span>${escapeHTML(student.batch)}</span>
            </div>

            <div>
                <strong>Semester</strong>
                <span>${student.semester ?? "-"}</span>
            </div>

            <div>
                <strong>Gender</strong>
                <span>${escapeHTML(student.gender)}</span>
            </div>

            <div>
                <strong>Account Status</strong>
                <span>
                    ${
                        student.account_status
                            ? "Active"
                            : "Inactive"
                    }
                </span>
            </div>

            <div>
                <strong>Approval Status</strong>
                <span>
                    ${
                        student.isApproved
                            ? "Approved"
                            : "Pending"
                    }
                </span>
            </div>

        </div>

    `;

    modal.classList.add("show");

}


// ==========================================
// TABLE ACTIONS
// ==========================================

tableBody.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest("button");

        if (!button) return;


        const studentId =
            button.dataset.id;

        const student =
            students.find(
                item =>
                    item.docId === studentId
            );

        if (!student) return;


        // VIEW

        if (
            button.classList.contains(
                "view-btn"
            )
        ) {

            showStudent(student);

        }


        // APPROVE

        else if (
            button.classList.contains(
                "approve-btn"
            )
        ) {

            await approveStudent(student);

        }


        // REJECT

        else if (
            button.classList.contains(
                "reject-btn"
            )
        ) {

            await rejectStudent(student);

        }


        // ACTIVATE / DEACTIVATE

        else if (
            button.classList.contains(
                "status-btn"
            )
        ) {

            await toggleStudentStatus(
                student
            );

        }

    }
);


// ==========================================
// APPROVE STUDENT
// ==========================================

async function approveStudent(student) {

    const confirmed =
        confirm(
            `Approve ${student.name}?`
        );

    if (!confirmed) return;


    try {

        await updateDoc(
            doc(
                db,
                "students",
                student.docId
            ),
            {

                isApproved: true,

                account_status: true,

                student_status: true,

                approvedAt: new Date(),

                approvedBy:
                    auth.currentUser.uid,

                approvedByName:
                    auth.currentUser.email

            }
        );


        alert(
            "Student approved successfully."
        );


        await loadStudents();

    }

    catch (error) {

        console.error(
            "Approval error:",
            error
        );

        alert(
            "Failed to approve student."
        );

    }

}


// ==========================================
// REJECT STUDENT
// ==========================================

async function rejectStudent(student) {

    const confirmed =
        confirm(
            `Reject ${student.name}?`
        );

    if (!confirmed) return;


    try {

        await updateDoc(
            doc(
                db,
                "students",
                student.docId
            ),
            {

                isApproved: false,

                account_status: false,

                student_status: false,

                registration_status:
                    "rejected",

                rejectedAt:
                    new Date(),

                rejectedBy:
                    auth.currentUser.uid,

                rejectedByName:
                    auth.currentUser.email

            }
        );


        alert(
            "Student registration rejected."
        );


        await loadStudents();

    }

    catch (error) {

        console.error(
            "Rejection error:",
            error
        );

        alert(
            "Failed to reject student."
        );

    }

}


// ==========================================
// ACTIVATE / DEACTIVATE
// ==========================================

async function toggleStudentStatus(student) {

    const newStatus =
        !student.account_status;


    const action =
        newStatus
            ? "activate"
            : "deactivate";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} ${student.name}?`
        );

    if (!confirmed) return;


    try {

        await updateDoc(
            doc(
                db,
                "students",
                student.docId
            ),
            {

                account_status:
                    newStatus,

                student_status:
                    newStatus

            }
        );


        alert(
            `Student ${action}d successfully.`
        );


        await loadStudents();

    }

    catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            "Failed to update student status."
        );

    }

}


// ==========================================
// SEARCH / FILTER
// ==========================================

searchInput.addEventListener(
    "input",
    renderStudents
);

statusFilter.addEventListener(
    "change",
    renderStudents
);

departmentFilter.addEventListener(
    "change",
    renderStudents
);

refreshBtn.addEventListener(
    "click",
    loadStudents
);


// ==========================================
// MODAL
// ==========================================

closeModal.addEventListener(
    "click",
    () => {

        modal.classList.remove("show");

    }
);


modal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === modal
        ) {

            modal.classList.remove(
                "show"
            );

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href =
            "login.html";

    }
);


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "-";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}