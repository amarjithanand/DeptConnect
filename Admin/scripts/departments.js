/* =========================================
   DEPTCONNECT ADMIN
   DEPARTMENT MANAGEMENT
========================================= */


import {

    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const {

    auth,
    db,
    onAuthStateChanged,
    signOut

} = window.deptConnectFirebase;



/* =========================================
   DOM ELEMENTS
========================================= */

const totalCount =
    document.getElementById(
        "totalCount"
    );


const activeCount =
    document.getElementById(
        "activeCount"
    );


const inactiveCount =
    document.getElementById(
        "inactiveCount"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


const addDepartmentBtn =
    document.getElementById(
        "addDepartmentBtn"
    );


const departmentList =
    document.getElementById(
        "departmentList"
    );


const loading =
    document.getElementById(
        "loading"
    );


const noResults =
    document.getElementById(
        "noResults"
    );


const resultCount =
    document.getElementById(
        "resultCount"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );



/* =========================================
   MODAL ELEMENTS
========================================= */

const departmentModal =
    document.getElementById(
        "departmentModal"
    );


const detailsModal =
    document.getElementById(
        "detailsModal"
    );


const departmentForm =
    document.getElementById(
        "departmentForm"
    );


const modalTitle =
    document.getElementById(
        "modalTitle"
    );


const closeModalBtn =
    document.getElementById(
        "closeModalBtn"
    );


const cancelBtn =
    document.getElementById(
        "cancelBtn"
    );


const closeDetailsBtn =
    document.getElementById(
        "closeDetailsBtn"
    );


const departmentName =
    document.getElementById(
        "departmentName"
    );


const departmentCode =
    document.getElementById(
        "departmentCode"
    );


const departmentDescription =
    document.getElementById(
        "departmentDescription"
    );


const departmentStatus =
    document.getElementById(
        "departmentStatus"
    );


const saveBtn =
    document.getElementById(
        "saveBtn"
    );


const formError =
    document.getElementById(
        "formError"
    );



/* =========================================
   STATE
========================================= */

let allDepartments = [];

let editingDepartmentId = null;

let currentAdmin = null;



/* =========================================
   ADMIN AUTHENTICATION
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

            /*
                Admin role is stored in:

                role collection

                uid = Firebase Auth UID
                role = admin
            */

            const roleQuery =
                query(

                    collection(
                        db,
                        "role"
                    ),

                    where(
                        "uid",
                        "==",
                        user.uid
                    )

                );


            const roleSnapshot =
                await getDocs(
                    roleQuery
                );


            if (
                roleSnapshot.empty
            ) {

                await signOut(auth);

                alert(
                    "Access denied. Admin account required."
                );

                window.location.href =
                    "login.html";

                return;

            }


            let isAdmin = false;


            roleSnapshot.forEach(
                document => {

                    const data =
                        document.data();


                    if (
                        data.role ===
                        "admin"
                    ) {

                        isAdmin = true;

                    }

                }
            );


            if (!isAdmin) {

                await signOut(auth);

                alert(
                    "Access denied. Admin account required."
                );

                window.location.href =
                    "login.html";

                return;

            }


            currentAdmin =
                user;


            adminEmail.textContent =
                user.email || "Admin";


            await loadDepartments();

        }
        catch (error) {

            console.error(
                "Admin authentication error:",
                error
            );

            alert(
                "Unable to verify admin access."
            );

            window.location.href =
                "login.html";

        }

    }
);



/* =========================================
   LOAD DEPARTMENTS
========================================= */

async function loadDepartments() {

    try {

        loading.style.display =
            "block";


        departmentList.innerHTML =
            "";


        noResults.style.display =
            "none";


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "departments"
                )
            );


        allDepartments = [];


        snapshot.forEach(
            document => {

                allDepartments.push({

                    id:
                        document.id,

                    ...document.data()

                });

            }
        );


        /*
            Sort alphabetically.
        */

        allDepartments.sort(
            (a, b) => {

                return (
                    (a.name || "")
                        .toLowerCase()
                        .localeCompare(
                            (b.name || "")
                                .toLowerCase()
                        )
                );

            }
        );


        updateStatistics();


        applyFilters();


    }
    catch (error) {

        console.error(
            "Error loading departments:",
            error
        );


        departmentList.innerHTML = "";


        noResults.style.display =
            "block";


        noResults.querySelector(
            "h3"
        ).textContent =
            "Unable to load departments";


        noResults.querySelector(
            "p"
        ).textContent =
            "Please check your connection and try again.";

    }
    finally {

        loading.style.display =
            "none";

    }

}



/* =========================================
   UPDATE STATISTICS
========================================= */

function updateStatistics() {

    const total =
        allDepartments.length;


    const active =
        allDepartments.filter(
            department =>
                department.status === true
        ).length;


    const inactive =
        allDepartments.filter(
            department =>
                department.status !== true
        ).length;


    totalCount.textContent =
        total;


    activeCount.textContent =
        active;


    inactiveCount.textContent =
        inactive;

}



/* =========================================
   APPLY FILTERS
========================================= */

function applyFilters() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter.value;


    let filteredDepartments =
        [...allDepartments];


    /* ================================
       SEARCH
    ================================= */

    if (searchTerm) {

        filteredDepartments =
            filteredDepartments.filter(
                department => {

                    const name =
                        (
                            department.name ||
                            ""
                        ).toLowerCase();


                    const code =
                        (
                            department.code ||
                            ""
                        ).toLowerCase();


                    const description =
                        (
                            department.description ||
                            ""
                        ).toLowerCase();


                    return (

                        name.includes(
                            searchTerm
                        )

                        ||

                        code.includes(
                            searchTerm
                        )

                        ||

                        description.includes(
                            searchTerm
                        )

                    );

                }
            );

    }



    /* ================================
       STATUS FILTER
    ================================= */

    if (
        selectedStatus !==
        "all"
    ) {

        filteredDepartments =
            filteredDepartments.filter(
                department => {

                    if (
                        selectedStatus ===
                        "active"
                    ) {

                        return (
                            department.status ===
                            true
                        );

                    }


                    if (
                        selectedStatus ===
                        "inactive"
                    ) {

                        return (
                            department.status !==
                            true
                        );

                    }


                    return true;

                }
            );

    }


    renderDepartments(
        filteredDepartments
    );

}



/* =========================================
   RENDER DEPARTMENTS
========================================= */

function renderDepartments(
    departments
) {

    departmentList.innerHTML =
        "";


    resultCount.textContent =
        `${departments.length} department${
            departments.length !== 1
                ? "s"
                : ""
        }`;


    if (
        departments.length ===
        0
    ) {

        noResults.style.display =
            "block";

        return;

    }


    noResults.style.display =
        "none";


    departments.forEach(
        department => {

            departmentList.appendChild(
                createDepartmentCard(
                    department
                )
            );

        }
    );

}



/* =========================================
   CREATE DEPARTMENT CARD
========================================= */

function createDepartmentCard(
    department
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "department-card";


    const isActive =
        department.status === true;


    const statusText =
        isActive
            ? "Active"
            : "Inactive";


    const statusClass =
        isActive
            ? "active"
            : "inactive";


    article.innerHTML = `

        <div class="department-main">

            <div class="department-icon">
                🏢
            </div>

            <div class="department-info">

                <div class="department-title">

                    <h3>
                        ${escapeHTML(
                            department.name ||
                            "Unnamed Department"
                        )}
                    </h3>

                    <span class="status ${statusClass}">
                        ${statusText}
                    </span>

                </div>

                <span class="department-code">
                    ${escapeHTML(
                        department.code ||
                        "NO CODE"
                    )}
                </span>

                <p>
                    ${escapeHTML(
                        department.description ||
                        "No description available."
                    )}
                </p>

            </div>

        </div>


        <div class="department-actions">

            <button
                class="action-btn view-btn"
                data-action="view"
            >
                View
            </button>

            <button
                class="action-btn edit-btn"
                data-action="edit"
            >
                Edit
            </button>

            <button
                class="action-btn toggle-btn"
                data-action="toggle"
            >
                ${
                    isActive
                        ? "Deactivate"
                        : "Activate"
                }
            </button>

            <button
                class="action-btn delete-btn"
                data-action="delete"
            >
                Delete
            </button>

        </div>

    `;


    /*
        Button events
    */

    article
        .querySelector(
            '[data-action="view"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openDetailsModal(
                    department
                );

            }
        );


    article
        .querySelector(
            '[data-action="edit"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openEditModal(
                    department
                );

            }
        );


    article
        .querySelector(
            '[data-action="toggle"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleDepartment(
                    department
                );

            }
        );


    article
        .querySelector(
            '[data-action="delete"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteDepartment(
                    department
                );

            }
        );


    /*
        Clicking card opens details.
    */

    article.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "button"
                )
            ) {

                return;

            }


            openDetailsModal(
                department
            );

        }
    );


    return article;

}



/* =========================================
   OPEN ADD MODAL
========================================= */

function openAddModal() {

    editingDepartmentId =
        null;


    modalTitle.textContent =
        "Add Department";


    saveBtn.textContent =
        "Save Department";


    departmentForm.reset();


    departmentStatus.value =
        "true";


    formError.textContent =
        "";


    departmentModal.classList.add(
        "show"
    );


    departmentName.focus();

}



/* =========================================
   OPEN EDIT MODAL
========================================= */

function openEditModal(
    department
) {

    editingDepartmentId =
        department.id;


    modalTitle.textContent =
        "Edit Department";


    saveBtn.textContent =
        "Update Department";


    departmentName.value =
        department.name || "";


    departmentCode.value =
        department.code || "";


    departmentDescription.value =
        department.description || "";


    departmentStatus.value =
        department.status === true
            ? "true"
            : "false";


    formError.textContent =
        "";


    departmentModal.classList.add(
        "show"
    );


    departmentName.focus();

}



/* =========================================
   CLOSE ADD / EDIT MODAL
========================================= */

function closeDepartmentModal() {

    departmentModal.classList.remove(
        "show"
    );


    editingDepartmentId =
        null;


    departmentForm.reset();


    formError.textContent =
        "";

}



/* =========================================
   SAVE DEPARTMENT
========================================= */

departmentForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            departmentName.value
                .trim();


        const code =
            departmentCode.value
                .trim();


        const description =
            departmentDescription.value
                .trim();


        const status =
            departmentStatus.value ===
            "true";


        formError.textContent =
            "";


        if (!name) {

            formError.textContent =
                "Department name is required.";

            return;

        }


        if (!code) {

            formError.textContent =
                "Department code is required.";

            return;

        }


        /*
            Prevent duplicate department names
            and codes.
        */

        const duplicate =
            allDepartments.some(
                department => {

                    if (
                        department.id ===
                        editingDepartmentId
                    ) {

                        return false;

                    }


                    const existingName =
                        (
                            department.name ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const existingCode =
                        (
                            department.code ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (

                        existingName ===
                        name.toLowerCase()

                        ||

                        existingCode ===
                        code.toLowerCase()

                    );

                }
            );


        if (duplicate) {

            formError.textContent =
                "A department with the same name or code already exists.";

            return;

        }


    try {

        saveBtn.disabled =
            true;


        saveBtn.textContent =
            editingDepartmentId
                ? "Updating..."
                : "Saving...";


        const departmentData = {

            name:
                name,

            code:
                code,

            description:
                description,

            status:
                status

        };


        /* ================================
           UPDATE
        ================================= */

        if (
            editingDepartmentId
        ) {

            await updateDoc(

                doc(
                    db,
                    "departments",
                    editingDepartmentId
                ),

                departmentData

            );

        }


        /* ================================
           CREATE
        ================================= */

        else {

            await addDoc(

                collection(
                    db,
                    "departments"
                ),

                {

                    ...departmentData,

                    createdAt:
                        serverTimestamp()

                }

            );

        }


        closeDepartmentModal();


        await loadDepartments();


    }
    catch (error) {

        console.error(
            "Error saving department:",
            error
        );


        formError.textContent =
            "Unable to save department. Please try again.";

    }
    finally {

        saveBtn.disabled =
            false;


        saveBtn.textContent =
            editingDepartmentId
                ? "Update Department"
                : "Save Department";

    }

    }
);



/* =========================================
   TOGGLE DEPARTMENT
========================================= */

async function toggleDepartment(
    department
) {

    const newStatus =
        department.status !== true;


    const action =
        newStatus
            ? "activate"
            : "deactivate";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} "${department.name}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "departments",
                department.id
            ),

            {

                status:
                    newStatus

            }

        );


        await loadDepartments();

    }
    catch (error) {

        console.error(
            "Error updating department:",
            error
        );


        alert(
            "Unable to update department."
        );

    }

}



/* =========================================
   DELETE DEPARTMENT
========================================= */

async function deleteDepartment(
    department
) {

    const confirmed =
        confirm(

            `Delete "${department.name}" permanently?\n\n` +

            "This should only be done if the department " +
            "is no longer required."

        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "departments",
                department.id
            )

        );


        await loadDepartments();

    }
    catch (error) {

        console.error(
            "Error deleting department:",
            error
        );


        alert(
            "Unable to delete department."
        );

    }

}



/* =========================================
   DETAILS MODAL
========================================= */

function openDetailsModal(
    department
) {

    document.getElementById(
        "detailsName"
    ).textContent =
        department.name ||
        "—";


    document.getElementById(
        "detailsCode"
    ).textContent =
        department.code ||
        "—";


    document.getElementById(
        "detailsStatus"
    ).textContent =
        department.status === true
            ? "Active"
            : "Inactive";


    document.getElementById(
        "detailsDescription"
    ).textContent =
        department.description ||
        "No description available.";


    document.getElementById(
        "detailsCreated"
    ).textContent =
        formatDate(
            department.createdAt
        );


    detailsModal.classList.add(
        "show"
    );

}



/* =========================================
   CLOSE DETAILS MODAL
========================================= */

function closeDetailsModal() {

    detailsModal.classList.remove(
        "show"
    );

}



/* =========================================
   FORMAT DATE
========================================= */

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "Not available";

    }


    let date;


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    }
    else if (
        timestamp instanceof Date
    ) {

        date =
            timestamp;

    }
    else {

        date =
            new Date(timestamp);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Not available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }
    );

}



/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(
    value
) {

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



/* =========================================
   EVENT LISTENERS
========================================= */

searchInput.addEventListener(
    "input",
    applyFilters
);


statusFilter.addEventListener(
    "change",
    applyFilters
);


refreshBtn.addEventListener(
    "click",
    loadDepartments
);


addDepartmentBtn.addEventListener(
    "click",
    openAddModal
);


closeModalBtn.addEventListener(
    "click",
    closeDepartmentModal
);


cancelBtn.addEventListener(
    "click",
    closeDepartmentModal
);


closeDetailsBtn.addEventListener(
    "click",
    closeDetailsModal
);



/* =========================================
   CLOSE MODALS ON BACKDROP CLICK
========================================= */

departmentModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            departmentModal
        ) {

            closeDepartmentModal();

        }

    }
);


detailsModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            detailsModal
        ) {

            closeDetailsModal();

        }

    }
);



/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeDepartmentModal();

            closeDetailsModal();

        }

    }
);



/* =========================================
   LOGOUT
========================================= */

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(
                auth
            );


            window.location.href =
                "login.html";

        }
        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);