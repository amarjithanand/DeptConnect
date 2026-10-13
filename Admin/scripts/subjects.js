/* =========================================
   DEPTCONNECT ADMIN
   SUBJECT MANAGEMENT
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
   DOM
========================================= */

const totalCount =
    document.getElementById("totalCount");

const activeCount =
    document.getElementById("activeCount");

const inactiveCount =
    document.getElementById("inactiveCount");

const searchInput =
    document.getElementById("searchInput");

const departmentFilter =
    document.getElementById("departmentFilter");

const semesterFilter =
    document.getElementById("semesterFilter");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBtn =
    document.getElementById("refreshBtn");

const addSubjectBtn =
    document.getElementById("addSubjectBtn");

const subjectList =
    document.getElementById("subjectList");

const loading =
    document.getElementById("loading");

const noResults =
    document.getElementById("noResults");

const resultCount =
    document.getElementById("resultCount");

const logoutBtn =
    document.getElementById("logoutBtn");

const adminEmail =
    document.getElementById("adminEmail");


/* FORM */

const subjectModal =
    document.getElementById("subjectModal");

const detailsModal =
    document.getElementById("detailsModal");

const subjectForm =
    document.getElementById("subjectForm");

const modalTitle =
    document.getElementById("modalTitle");

const subjectName =
    document.getElementById("subjectName");

const subjectCode =
    document.getElementById("subjectCode");

const subjectDepartment =
    document.getElementById("subjectDepartment");

const subjectSemester =
    document.getElementById("subjectSemester");

const subjectDescription =
    document.getElementById("subjectDescription");

const subjectStatus =
    document.getElementById("subjectStatus");

const formError =
    document.getElementById("formError");

const saveBtn =
    document.getElementById("saveBtn");


/* STATE */

let allSubjects = [];

let allDepartments = [];

let editingSubjectId = null;



/* =========================================
   ADMIN AUTH
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        try {

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


            adminEmail.textContent =
                user.email ||
                "Admin";


            await loadDepartments();

            await loadSubjects();

        }
        catch (error) {

            console.error(
                "Admin authentication error:",
                error
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

                const data =
                    document.data();


                allDepartments.push({

                    id:
                        document.id,

                    ...data

                });

            }
        );


        allDepartments.sort(
            (a, b) =>
                (a.name || "")
                    .localeCompare(
                        b.name || ""
                    )
        );


        populateDepartmentFilters();


    }
    catch (error) {

        console.error(
            "Error loading departments:",
            error
        );

    }

}



/* =========================================
   POPULATE DEPARTMENT FILTERS
========================================= */

function populateDepartmentFilters() {

    departmentFilter.innerHTML = `

        <option value="all">
            All Departments
        </option>

    `;


    subjectDepartment.innerHTML = `

        <option value="">
            Select Department
        </option>

    `;


    allDepartments.forEach(
        department => {

            const name =
                department.name || "";

            const code =
                department.code || "";

            const value =
                code || name;

            /*
                Filter dropdown
            */

            const filterOption =
                document.createElement(
                    "option"
                );

            filterOption.value =
                value;

            filterOption.textContent =
                code && name && code.toLowerCase() !== name.toLowerCase()
                    ? `${name} (${code})`
                    : (name || code);

            departmentFilter.appendChild(
                filterOption
            );


            /*
                Form dropdown (Active departments only)
            */

            if (department.status !== false) {

                const formOption =
                    document.createElement(
                        "option"
                    );

                formOption.value =
                    value;

                formOption.dataset.id =
                    department.id;

                formOption.dataset.code =
                    code;

                formOption.dataset.name =
                    name;

                formOption.textContent =
                    code && name && code.toLowerCase() !== name.toLowerCase()
                        ? `${name} (${code})`
                        : (name || code);

                subjectDepartment.appendChild(
                    formOption
                );

            }

        }
    );

}



/* =========================================
   LOAD SUBJECTS
========================================= */

async function loadSubjects() {

    try {

        loading.style.display =
            "block";


        subjectList.innerHTML =
            "";


        noResults.style.display =
            "none";


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "subjects"
                )
            );


        allSubjects = [];


        snapshot.forEach(
            document => {

                allSubjects.push({

                    id:
                        document.id,

                    ...document.data()

                });

            }
        );


        allSubjects.sort(
            (a, b) => {

                const first =
                    (a.name || "")
                        .toLowerCase();


                const second =
                    (b.name || "")
                        .toLowerCase();


                return first.localeCompare(
                    second
                );

            }
        );


        updateStatistics();

        applyFilters();

    }
    catch (error) {

        console.error(
            "Error loading subjects:",
            error
        );


        noResults.style.display =
            "block";


        noResults.querySelector(
            "h3"
        ).textContent =
            "Unable to load subjects";


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
   STATISTICS
========================================= */

function updateStatistics() {

    const total =
        allSubjects.length;


    const active =
        allSubjects.filter(
            subject =>
                subject.status === true
        ).length;


    const inactive =
        allSubjects.filter(
            subject =>
                subject.status !== true
        ).length;


    totalCount.textContent =
        total;


    activeCount.textContent =
        active;


    inactiveCount.textContent =
        inactive;

}



/* =========================================
   GET DEPARTMENT NAME
========================================= */

function getDepartmentName(
    departmentId
) {

    const department =
        allDepartments.find(
            item =>
                item.id ===
                departmentId
                ||
                item.code ===
                departmentId
                ||
                item.name ===
                departmentId
        );


    if (department) {

        return department.name;

    }

    return departmentId ||
        "Not specified";

}



/* =========================================
   APPLY FILTERS
========================================= */

function applyFilters() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedDepartment =
        departmentFilter.value;


    const selectedSemester =
        semesterFilter.value;


    const selectedStatus =
        statusFilter.value;


    let filtered =
        [...allSubjects];


    /* SEARCH */

    if (searchTerm) {

        filtered =
            filtered.filter(
                subject => {

                    const name =
                        (
                            subject.name ||
                            ""
                        ).toLowerCase();


                    const code =
                        (
                            subject.code ||
                            ""
                        ).toLowerCase();


                    const description =
                        (
                            subject.description ||
                            ""
                        ).toLowerCase();


                    const departmentName =
                        getDepartmentName(
                            subject.department
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

                        ||

                        departmentName.includes(
                            searchTerm
                        )

                    );

                }
            );

    }


    /* DEPARTMENT */

    if (
        selectedDepartment !==
        "all"
    ) {

        filtered =
            filtered.filter(
                subject =>
                    subject.department ===
                    selectedDepartment
                    ||
                    subject.departmentId ===
                    selectedDepartment
                    ||
                    subject.departmentCode ===
                    selectedDepartment
                    ||
                    subject.departmentName ===
                    selectedDepartment
            );

    }


    /* SEMESTER */

    if (
        selectedSemester !==
        "all"
    ) {

        filtered =
            filtered.filter(
                subject =>
                    String(
                        subject.semester
                    ) ===
                    selectedSemester
            );

    }


    /* STATUS */

    if (
        selectedStatus !==
        "all"
    ) {

        filtered =
            filtered.filter(
                subject => {

                    if (
                        selectedStatus ===
                        "active"
                    ) {

                        return (
                            subject.status ===
                            true
                        );

                    }


                    return (
                        subject.status !==
                        true
                    );

                }
            );

    }


    renderSubjects(
        filtered
    );

}



/* =========================================
   RENDER
========================================= */

function renderSubjects(
    subjects
) {

    subjectList.innerHTML =
        "";


    resultCount.textContent =
        `${subjects.length} subject${
            subjects.length !== 1
                ? "s"
                : ""
        }`;


    if (
        subjects.length ===
        0
    ) {

        noResults.style.display =
            "block";

        return;

    }


    noResults.style.display =
        "none";


    subjects.forEach(
        subject => {

            subjectList.appendChild(
                createSubjectCard(
                    subject
                )
            );

        }
    );

}



/* =========================================
   CREATE CARD
========================================= */

function createSubjectCard(
    subject
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "subject-card";


    const active =
        subject.status === true;


    const departmentName =
        getDepartmentName(
            subject.department
        );


    article.innerHTML = `

        <div class="subject-main">

            <div class="subject-icon">
                📚
            </div>


            <div class="subject-info">

                <div class="subject-title">

                    <h3>
                        ${escapeHTML(
                            subject.name ||
                            "Unnamed Subject"
                        )}
                    </h3>

                    <span class="status ${
                        active
                            ? "active"
                            : "inactive"
                    }">

                        ${
                            active
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </div>


                <div class="subject-meta">

                    <span class="code">
                        ${escapeHTML(
                            subject.code ||
                            "NO CODE"
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            departmentName
                        )}
                    </span>

                    <span>
                        Semester ${
                            subject.semester ||
                            "—"
                        }
                    </span>

                </div>


                <p>
                    ${escapeHTML(
                        subject.description ||
                        "No description available."
                    )}
                </p>

            </div>

        </div>


        <div class="subject-actions">

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
                    active
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


    article
        .querySelector(
            '[data-action="view"]'
        )
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openDetailsModal(
                    subject
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
                    subject
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

                toggleSubject(
                    subject
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

                deleteSubject(
                    subject
                );

            }
        );


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
                subject
            );

        }
    );


    return article;

}



/* =========================================
   ADD MODAL
========================================= */

function openAddModal() {

    editingSubjectId =
        null;


    modalTitle.textContent =
        "Add Subject";


    saveBtn.textContent =
        "Save Subject";


    subjectForm.reset();


    subjectStatus.value =
        "true";


    formError.textContent =
        "";


    subjectModal.classList.add(
        "show"
    );


    subjectName.focus();

}



/* =========================================
   EDIT MODAL
========================================= */

function openEditModal(
    subject
) {

    editingSubjectId =
        subject.id;


    modalTitle.textContent =
        "Edit Subject";


    saveBtn.textContent =
        "Update Subject";


    subjectName.value =
        subject.name || "";


    subjectCode.value =
        subject.code || "";


    let matchedDept =
        subject.department ||
        subject.departmentId ||
        "";

    for (
        const opt
        of subjectDepartment.options
    ) {

        if (
            opt.value === matchedDept
            ||
            opt.dataset?.id === matchedDept
            ||
            opt.dataset?.code === matchedDept
            ||
            opt.dataset?.name === matchedDept
        ) {

            matchedDept = opt.value;
            break;

        }

    }

    subjectDepartment.value =
        matchedDept;


    subjectSemester.value =
        subject.semester
            ? String(subject.semester)
            : "";


    subjectDescription.value =
        subject.description || "";


    subjectStatus.value =
        subject.status === true
            ? "true"
            : "false";


    formError.textContent =
        "";


    subjectModal.classList.add(
        "show"
    );


    subjectName.focus();

}



/* =========================================
   SAVE SUBJECT
========================================= */

subjectForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            subjectName.value
                .trim();


        const code =
            subjectCode.value
                .trim()
                .toUpperCase();


        const department =
            subjectDepartment.value;


        const semester =
            Number(
                subjectSemester.value
            );


        const description =
            subjectDescription.value
                .trim();


        const status =
            subjectStatus.value ===
            "true";


        formError.textContent =
            "";


        if (!name) {

            formError.textContent =
                "Subject name is required.";

            return;

        }


        if (!code) {

            formError.textContent =
                "Subject code is required.";

            return;

        }


        if (!department) {

            formError.textContent =
                "Please select a department.";

            return;

        }


        if (
            !semester ||
            semester < 1 ||
            semester > 8
        ) {

            formError.textContent =
                "Please select a valid semester.";

            return;

        }


        /*
            Prevent duplicate subject code
            inside the same department.
        */

        const duplicate =
            allSubjects.some(
                subject => {

                    if (
                        subject.id ===
                        editingSubjectId
                    ) {

                        return false;

                    }


                    return (

                        String(
                            subject.code ||
                            ""
                        )
                            .toLowerCase() ===
                        code.toLowerCase()

                        &&

                        subject.department ===
                        department

                    );

                }
            );


        if (duplicate) {

            formError.textContent =
                "This subject code already exists in the selected department.";

            return;

        }


        try {

            saveBtn.disabled =
                true;


            saveBtn.textContent =
                editingSubjectId
                    ? "Updating..."
                    : "Saving...";


            const selectedDept =
                allDepartments.find(
                    d =>
                        d.id === department
                        ||
                        d.code === department
                        ||
                        d.name === department
                );

            const deptKey =
                (selectedDept && selectedDept.code)
                    ? selectedDept.code
                    : (selectedDept ? selectedDept.name : department);

            const subjectData = {

                name:
                    name,

                code:
                    code,

                department:
                    deptKey,

                departmentId:
                    selectedDept ? selectedDept.id : "",

                departmentName:
                    selectedDept ? selectedDept.name : "",

                departmentCode:
                    selectedDept ? (selectedDept.code || "") : "",

                semester:
                    semester,

                description:
                    description,

                status:
                    status

            };


            if (
                editingSubjectId
            ) {

                await updateDoc(

                    doc(
                        db,
                        "subjects",
                        editingSubjectId
                    ),

                    subjectData

                );

            }
            else {

                await addDoc(

                    collection(
                        db,
                        "subjects"
                    ),

                    {

                        ...subjectData,

                        createdAt:
                            serverTimestamp()

                    }

                );

            }


            closeSubjectModal();


            await loadSubjects();

        }
        catch (error) {

            console.error(
                "Error saving subject:",
                error
            );


            formError.textContent =
                "Unable to save subject. Please try again.";

        }
        finally {

            saveBtn.disabled =
                false;


            saveBtn.textContent =
                editingSubjectId
                    ? "Update Subject"
                    : "Save Subject";

        }

    }
);



/* =========================================
   TOGGLE
========================================= */

async function toggleSubject(
    subject
) {

    const newStatus =
        subject.status !== true;


    const action =
        newStatus
            ? "activate"
            : "deactivate";


    if (
        !confirm(
            `Are you sure you want to ${action} "${subject.name}"?`
        )
    ) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "subjects",
                subject.id
            ),

            {

                status:
                    newStatus

            }

        );


        await loadSubjects();

    }
    catch (error) {

        console.error(
            "Error updating subject:",
            error
        );


        alert(
            "Unable to update subject."
        );

    }

}



/* =========================================
   DELETE
========================================= */

async function deleteSubject(
    subject
) {

    if (
        !confirm(
            `Delete "${subject.name}" permanently?`
        )
    ) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "subjects",
                subject.id
            )

        );


        await loadSubjects();

    }
    catch (error) {

        console.error(
            "Error deleting subject:",
            error
        );


        alert(
            "Unable to delete subject."
        );

    }

}



/* =========================================
   DETAILS
========================================= */

function openDetailsModal(
    subject
) {

    document.getElementById(
        "detailsName"
    ).textContent =
        subject.name ||
        "—";


    document.getElementById(
        "detailsCode"
    ).textContent =
        subject.code ||
        "—";


    document.getElementById(
        "detailsDepartment"
    ).textContent =
        getDepartmentName(
            subject.department
        );


    document.getElementById(
        "detailsSemester"
    ).textContent =
        subject.semester
            ? `Semester ${subject.semester}`
            : "—";


    document.getElementById(
        "detailsStatus"
    ).textContent =
        subject.status === true
            ? "Active"
            : "Inactive";


    document.getElementById(
        "detailsDescription"
    ).textContent =
        subject.description ||
        "No description available.";


    document.getElementById(
        "detailsCreated"
    ).textContent =
        formatDate(
            subject.createdAt
        );


    detailsModal.classList.add(
        "show"
    );

}



/* =========================================
   CLOSE MODALS
========================================= */

function closeSubjectModal() {

    subjectModal.classList.remove(
        "show"
    );


    editingSubjectId =
        null;


    subjectForm.reset();

}


function closeDetailsModal() {

    detailsModal.classList.remove(
        "show"
    );

}



/* =========================================
   DATE
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
   EVENTS
========================================= */

searchInput.addEventListener(
    "input",
    applyFilters
);


departmentFilter.addEventListener(
    "change",
    applyFilters
);


semesterFilter.addEventListener(
    "change",
    applyFilters
);


statusFilter.addEventListener(
    "change",
    applyFilters
);


refreshBtn.addEventListener(
    "click",
    async () => {

        await loadDepartments();

        await loadSubjects();

    }
);


addSubjectBtn.addEventListener(
    "click",
    openAddModal
);


document
    .getElementById(
        "closeModalBtn"
    )
    .addEventListener(
        "click",
        closeSubjectModal
    );


document
    .getElementById(
        "cancelBtn"
    )
    .addEventListener(
        "click",
        closeSubjectModal
    );


document
    .getElementById(
        "closeDetailsBtn"
    )
    .addEventListener(
        "click",
        closeDetailsModal
    );



/* =========================================
   BACKDROP
========================================= */

subjectModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            subjectModal
        ) {

            closeSubjectModal();

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
   ESC
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeSubjectModal();

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