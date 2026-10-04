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
    document.getElementById("facultyTableBody");

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
    document.getElementById("facultyModal");

const closeModal =
    document.getElementById("closeModal");

const facultyDetails =
    document.getElementById("facultyDetails");


let facultyMembers = [];


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


        await loadFaculty();

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
// LOAD FACULTY
// ==========================================

async function loadFaculty() {

    try {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">
                    Loading faculty...
                </td>
            </tr>
        `;


        const snapshot =
            await getDocs(
                collection(db, "faculty")
            );


        facultyMembers = [];


        snapshot.forEach((facultyDoc) => {

            facultyMembers.push({

                docId: facultyDoc.id,

                ...facultyDoc.data()

            });

        });


        populateDepartments();

        updateSummary();

        renderFaculty();

    }

    catch (error) {

        console.error(
            "Error loading faculty:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="error">
                    Failed to load faculty.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// DEPARTMENTS
// ==========================================

function populateDepartments() {

    const departments =
        [
            ...new Set(
                facultyMembers
                    .map(
                        faculty =>
                            faculty.department
                    )
                    .filter(Boolean)
            )
        ].sort();


    departmentFilter.innerHTML = `
        <option value="all">
            All Departments
        </option>
    `;


    departments.forEach(
        department => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                department;

            option.textContent =
                department;

            departmentFilter.appendChild(
                option
            );

        }
    );

}


// ==========================================
// SUMMARY
// ==========================================

function updateSummary() {

    const total =
        facultyMembers.length;


    const pending =
        facultyMembers.filter(
            faculty =>
                faculty.isApproved === false
        ).length;


    const approved =
        facultyMembers.filter(
            faculty =>
                faculty.isApproved === true
        ).length;


    const inactive =
        facultyMembers.filter(
            faculty =>
                faculty.account_status === false
        ).length;


    document.getElementById(
        "totalFaculty"
    ).textContent = total;


    document.getElementById(
        "pendingFaculty"
    ).textContent = pending;


    document.getElementById(
        "approvedFaculty"
    ).textContent = approved;


    document.getElementById(
        "inactiveFaculty"
    ).textContent = inactive;

}


// ==========================================
// RENDER FACULTY
// ==========================================

function renderFaculty() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value;


    const department =
        departmentFilter.value;


    const filtered =
        facultyMembers.filter(
            faculty => {


                const matchesSearch =

                    !search ||

                    (faculty.name || "")
                        .toLowerCase()
                        .includes(search) ||

                    (faculty.email || "")
                        .toLowerCase()
                        .includes(search) ||

                    (faculty.facultyId || "")
                        .toLowerCase()
                        .includes(search);


                let matchesStatus = true;


                if (
                    status === "pending"
                ) {

                    matchesStatus =
                        faculty.isApproved === false;

                }

                else if (
                    status === "approved"
                ) {

                    matchesStatus =
                        faculty.isApproved === true;

                }

                else if (
                    status === "inactive"
                ) {

                    matchesStatus =
                        faculty.account_status === false;

                }


                const matchesDepartment =

                    department === "all" ||

                    faculty.department ===
                    department;


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesDepartment
                );

            }
        );


    tableBody.innerHTML = "";


    emptyMessage.style.display =
        filtered.length === 0
            ? "block"
            : "none";


    filtered.forEach(
        faculty => {


            const row =
                document.createElement(
                    "tr"
                );


            const approvalStatus =

                faculty.isApproved === true

                    ?

                    `<span class="badge approved">
                        Approved
                    </span>`

                    :

                    `<span class="badge pending">
                        Pending
                    </span>`;


            const accountStatus =

                faculty.account_status === true

                    ?

                    `<span class="badge active">
                        Active
                    </span>`

                    :

                    `<span class="badge inactive">
                        Inactive
                    </span>`;


            const subjects =
                Array.isArray(
                    faculty.subjects
                )
                    ? faculty.subjects.join(", ")
                    : "-";


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        faculty.facultyId
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        faculty.name
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        faculty.email
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        faculty.department
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        faculty.designation
                    )}
                </td>

                <td>
                    ${escapeHTML(subjects)}
                </td>

                <td>
                    ${accountStatus}
                </td>

                <td>
                    ${approvalStatus}
                </td>

                <td>

                    <div class="actions">

                        <button
                            class="view-btn"
                            data-id="${faculty.docId}"
                        >
                            View
                        </button>


                        ${
                            faculty.isApproved === false

                            ?

                            `
                            <button
                                class="approve-btn"
                                data-id="${faculty.docId}"
                            >
                                Approve
                            </button>

                            <button
                                class="reject-btn"
                                data-id="${faculty.docId}"
                            >
                                Reject
                            </button>
                            `

                            :

                            `
                            <button
                                class="status-btn"
                                data-id="${faculty.docId}"
                            >
                                ${
                                    faculty.account_status
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

        }
    );

}


// ==========================================
// VIEW FACULTY
// ==========================================

function showFaculty(faculty) {

    const subjects =
        Array.isArray(
            faculty.subjects
        )
            ? faculty.subjects
            : [];


    facultyDetails.innerHTML = `

        <div class="detail-grid">

            <div>
                <strong>Name</strong>
                <span>
                    ${escapeHTML(
                        faculty.name
                    )}
                </span>
            </div>


            <div>
                <strong>Faculty ID</strong>
                <span>
                    ${escapeHTML(
                        faculty.facultyId
                    )}
                </span>
            </div>


            <div>
                <strong>Email</strong>
                <span>
                    ${escapeHTML(
                        faculty.email
                    )}
                </span>
            </div>


            <div>
                <strong>Department</strong>
                <span>
                    ${escapeHTML(
                        faculty.department
                    )}
                </span>
            </div>


            <div>
                <strong>Designation</strong>
                <span>
                    ${escapeHTML(
                        faculty.designation
                    )}
                </span>
            </div>


            <div>
                <strong>Account Status</strong>
                <span>
                    ${
                        faculty.account_status
                            ? "Active"
                            : "Inactive"
                    }
                </span>
            </div>


            <div>
                <strong>Approval Status</strong>
                <span>
                    ${
                        faculty.isApproved
                            ? "Approved"
                            : "Pending"
                    }
                </span>
            </div>


            <div class="subjects-detail">

                <strong>
                    Subjects
                </strong>

                <span>
                    ${
                        subjects.length
                            ? subjects
                                .map(
                                    subject =>
                                        `<span class="subject-tag">
                                            ${escapeHTML(subject)}
                                         </span>`
                                )
                                .join("")
                            : "No subjects assigned"
                    }
                </span>

            </div>

        </div>

    `;


    modal.classList.add("show");

}


// ==========================================
// ACTIONS
// ==========================================

tableBody.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "button"
            );


        if (!button) return;


        const facultyId =
            button.dataset.id;


        const faculty =
            facultyMembers.find(
                item =>
                    item.docId ===
                    facultyId
            );


        if (!faculty) return;


        if (
            button.classList.contains(
                "view-btn"
            )
        ) {

            showFaculty(faculty);

        }


        else if (
            button.classList.contains(
                "approve-btn"
            )
        ) {

            await approveFaculty(
                faculty
            );

        }


        else if (
            button.classList.contains(
                "reject-btn"
            )
        ) {

            await rejectFaculty(
                faculty
            );

        }


        else if (
            button.classList.contains(
                "status-btn"
            )
        ) {

            await toggleFacultyStatus(
                faculty
            );

        }

    }
);


// ==========================================
// APPROVE
// ==========================================

async function approveFaculty(
    faculty
) {

    const confirmed =
        confirm(
            `Approve ${faculty.name}?`
        );


    if (!confirmed) return;


    try {

        await updateDoc(
            doc(
                db,
                "faculty",
                faculty.docId
            ),
            {

                isApproved: true,

                account_status: true,

                faculty_status: true,

                approvedAt:
                    new Date(),

                approvedBy:
                    auth.currentUser.uid,

                approvedByName:
                    auth.currentUser.email

            }
        );


        alert(
            "Faculty approved successfully."
        );


        await loadFaculty();

    }

    catch (error) {

        console.error(
            "Approval error:",
            error
        );


        alert(
            "Failed to approve faculty."
        );

    }

}


// ==========================================
// REJECT
// ==========================================

async function rejectFaculty(
    faculty
) {

    const confirmed =
        confirm(
            `Reject ${faculty.name}?`
        );


    if (!confirmed) return;


    try {

        await updateDoc(
            doc(
                db,
                "faculty",
                faculty.docId
            ),
            {

                isApproved: false,

                account_status: false,

                faculty_status: false,

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
            "Faculty registration rejected."
        );


        await loadFaculty();

    }

    catch (error) {

        console.error(
            "Rejection error:",
            error
        );


        alert(
            "Failed to reject faculty."
        );

    }

}


// ==========================================
// ACTIVATE / DEACTIVATE
// ==========================================

async function toggleFacultyStatus(
    faculty
) {

    const newStatus =
        !faculty.account_status;


    const action =
        newStatus
            ? "activate"
            : "deactivate";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} ${faculty.name}?`
        );


    if (!confirmed) return;


    try {

        await updateDoc(
            doc(
                db,
                "faculty",
                faculty.docId
            ),
            {

                account_status:
                    newStatus,

                faculty_status:
                    newStatus

            }
        );


        alert(
            `Faculty ${action}d successfully.`
        );


        await loadFaculty();

    }

    catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "Failed to update faculty status."
        );

    }

}


// ==========================================
// SEARCH / FILTER
// ==========================================

searchInput.addEventListener(
    "input",
    renderFaculty
);


statusFilter.addEventListener(
    "change",
    renderFaculty
);


departmentFilter.addEventListener(
    "change",
    renderFaculty
);


refreshBtn.addEventListener(
    "click",
    loadFaculty
);


// ==========================================
// MODAL
// ==========================================

closeModal.addEventListener(
    "click",
    () => {

        modal.classList.remove(
            "show"
        );

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

    if (
        value === null ||
        value === undefined
    ) {

        return "-";

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