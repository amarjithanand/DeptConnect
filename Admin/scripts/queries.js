import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const {

    auth,
    db,
    onAuthStateChanged,
    signOut

} = window.deptConnectFirebase;



/* =========================================
   STATE
========================================= */

let allQueries = [];

let allFaculty = [];

let selectedQuery = null;



/* =========================================
   DOM ELEMENTS
========================================= */

const adminEmail =
    document.getElementById(
        "adminEmail"
    );


const queryList =
    document.getElementById(
        "queryList"
    );


const noResults =
    document.getElementById(
        "noResults"
    );


const resultCount =
    document.getElementById(
        "resultCount"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const departmentFilter =
    document.getElementById(
        "departmentFilter"
    );


const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );


const assignmentFilter =
    document.getElementById(
        "assignmentFilter"
    );


const aiFilter =
    document.getElementById(
        "aiFilter"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


const logoutButton =
    document.getElementById(
        "logoutBtn"
    ) ||
    document.getElementById(
        "logoutButton"
    );



/* =========================================
   AUTHENTICATION
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


            if (
                roleSnapshot.empty
            ) {

                await signOut(
                    auth
                );

                window.location.href =
                    "login.html";

                return;

            }


            const roleData =
                roleSnapshot
                    .docs[0]
                    .data();


            if (
                roleData.role !==
                "admin"
            ) {

                await signOut(
                    auth
                );

                window.location.href =
                    "login.html";

                return;

            }


            adminEmail.textContent =
                user.email ||
                "Administrator";


            await initializePage();

        }

        catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            showToast(
                "Unable to verify admin access.",
                "error"
            );

        }

    }
);



/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializePage() {

    await Promise.all([

        loadFaculty(),

        loadQueries()

    ]);

}



/* =========================================
   LOAD FACULTY
========================================= */

async function loadFaculty() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "faculty"
                )
            );


        allFaculty =
            snapshot.docs
                .map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                )
                .filter(
                    faculty =>
                        faculty.isApproved === true &&
                        faculty.account_status === true &&
                        faculty.faculty_status !== false
                );


        populateFacultyDropdown();

    }

    catch (error) {

        console.error(
            "Faculty loading error:",
            error
        );

        showToast(
            "Unable to load faculty members.",
            "error"
        );

    }

}



/* =========================================
   POPULATE FACULTY DROPDOWN
========================================= */

function populateFacultyDropdown() {

    const select =
        document.getElementById(
            "facultySelect"
        );


    select.innerHTML = `

        <option value="">
            Select faculty
        </option>

    `;


    allFaculty
        .sort(
            (a, b) =>
                (a.name || "")
                    .localeCompare(
                        b.name || ""
                    )
        )
        .forEach(
            faculty => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    faculty.uid;


                option.textContent =
                    `${faculty.name || "Unnamed Faculty"} — ${faculty.department || "No Department"}`;


                option.dataset.facultyId =
                    faculty.facultyId ||
                    "";


                select.appendChild(
                    option
                );

            }
        );

}



/* =========================================
   LOAD QUERIES
========================================= */

async function loadQueries() {

    try {

        resultCount.textContent =
            "Loading queries...";


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "queries"
                )
            );


        allQueries =
            snapshot.docs
                .map(
                    document => ({

                        id:
                            document.id,

                        ...document.data()

                    })
                );


        updateStatistics();

        populateDepartmentFilter();

        applyFilters();

    }

    catch (error) {

        console.error(
            "Query loading error:",
            error
        );


        queryList.innerHTML =
            "";


        noResults.style.display =
            "block";


        noResults.querySelector(
            "h3"
        ).textContent =
            "Unable to load queries";


        noResults.querySelector(
            "p"
        ).textContent =
            "Please check your Firebase connection and try again.";


        showToast(
            "Failed to load queries.",
            "error"
        );

    }

}



/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const total =
        allQueries.length;


    const pending =
        allQueries.filter(
            item =>
                item.status ===
                "pending"
        ).length;


    const progress =
        allQueries.filter(
            item =>
                item.status ===
                "in-progress"
        ).length;


    const resolved =
        allQueries.filter(
            item =>
                item.status ===
                "resolved"
        ).length;


    const aiAnswered =
        allQueries.filter(
            item =>
                item.aiAnswered ===
                true
        ).length;


    const unassigned =
        allQueries.filter(
            item =>
                !item.assignedFacultyId
        ).length;


    document.getElementById(
        "totalCount"
    ).textContent =
        total;


    document.getElementById(
        "pendingCount"
    ).textContent =
        pending;


    document.getElementById(
        "progressCount"
    ).textContent =
        progress;


    document.getElementById(
        "resolvedCount"
    ).textContent =
        resolved;


    document.getElementById(
        "aiCount"
    ).textContent =
        aiAnswered;


    document.getElementById(
        "unassignedCount"
    ).textContent =
        unassigned;

}



/* =========================================
   DEPARTMENT FILTER
========================================= */

function populateDepartmentFilter() {

    const departments = [

        ...new Set(

            allQueries

                .map(
                    item =>
                        item.department
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
                normalize(
                    department
                );


            option.textContent =
                department;


            departmentFilter.appendChild(
                option
            );

        }
    );

}



/* =========================================
   FILTERS
========================================= */

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter.value;


    const selectedDepartment =
        departmentFilter.value;


    const selectedPriority =
        priorityFilter.value;


    const selectedAssignment =
        assignmentFilter.value;


    const selectedAI =
        aiFilter.value;


    let filtered =
        [...allQueries];



    /* SEARCH */

    if (search) {

        filtered =
            filtered.filter(
                item => {

                    const searchable = [

                        item.title,

                        item.description,

                        item.studentId,

                        item.course,

                        item.department,

                        item.assignedFacultyId

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                    return searchable.includes(
                        search
                    );

                }
            );

    }



    /* STATUS */

    if (
        selectedStatus !==
        "all"
    ) {

        filtered =
            filtered.filter(
                item =>
                    item.status ===
                    selectedStatus
            );

    }



    /* DEPARTMENT */

    if (
        selectedDepartment !==
        "all"
    ) {

        filtered =
            filtered.filter(
                item =>
                    normalize(
                        item.department
                    ) ===
                    selectedDepartment
            );

    }



    /* PRIORITY */

    if (
        selectedPriority !==
        "all"
    ) {

        filtered =
            filtered.filter(
                item =>
                    normalize(
                        item.priority
                    ) ===
                    selectedPriority
            );

    }



    /* ASSIGNMENT */

    if (
        selectedAssignment ===
        "assigned"
    ) {

        filtered =
            filtered.filter(
                item =>
                    Boolean(
                        item.assignedFacultyId
                    )
            );

    }

    else if (
        selectedAssignment ===
        "unassigned"
    ) {

        filtered =
            filtered.filter(
                item =>
                    !item.assignedFacultyId
            );

    }



    /* AI */

    if (
        selectedAI ===
        "processed"
    ) {

        filtered =
            filtered.filter(
                item =>
                    item.aiProcessed ===
                    true
            );

    }

    else if (
        selectedAI ===
        "answered"
    ) {

        filtered =
            filtered.filter(
                item =>
                    item.aiAnswered ===
                    true
            );

    }

    else if (
        selectedAI ===
        "not-processed"
    ) {

        filtered =
            filtered.filter(
                item =>
                    item.aiProcessed !==
                    true
            );

    }



    /* SORT */

    filtered.sort(
        (a, b) =>
            getTimestamp(
                b.createdAt
            )
            -
            getTimestamp(
                a.createdAt
            )
    );


    renderQueries(
        filtered
    );

}



/* =========================================
   RENDER QUERY CARDS
========================================= */

function renderQueries(
    queries
) {

    queryList.innerHTML =
        "";


    resultCount.textContent =
        `Showing ${queries.length} ${
            queries.length === 1
                ? "query"
                : "queries"
        }`;


    if (
        queries.length ===
        0
    ) {

        noResults.style.display =
            "block";

        return;

    }


    noResults.style.display =
        "none";


    queries.forEach(
        queryData => {

            queryList.appendChild(
                createQueryCard(
                    queryData
                )
            );

        }
    );

}



/* =========================================
   CREATE QUERY CARD
========================================= */

function createQueryCard(
    queryData
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "query-card";


    const status =
        getStatusInfo(
            queryData.status
        );


    const priority =
        queryData.priority ||
        "medium";


    const assignedFaculty =
        findFaculty(
            queryData.assignedFacultyId
        );


    const facultyName =
        assignedFaculty
            ? assignedFaculty.name
            : "Unassigned";


    const aiLabel =
        queryData.aiAnswered === true
            ? "AI Answered"
            : queryData.aiProcessed === true
                ? "AI Processed"
                : "AI Pending";


    article.innerHTML = `

        <div class="query-card-header">

            <div class="query-main">

                <div class="query-meta">

                    <span
                        class="status-badge ${status.className}"
                    >
                        ${status.label}
                    </span>

                    <span
                        class="priority-badge priority-${normalize(priority)}"
                    >
                        ${capitalize(priority)}
                    </span>

                    <span class="query-date">
                        ${formatRelativeTime(queryData.createdAt)}
                    </span>

                </div>


                <h2>
                    ${escapeHTML(
                        queryData.title ||
                        "Untitled Query"
                    )}
                </h2>


                <p class="query-description">

                    ${escapeHTML(
                        truncate(
                            queryData.description ||
                            "No description provided.",
                            180
                        )
                    )}

                </p>

            </div>


            <div class="query-id">

                ID

                <strong>
                    ${escapeHTML(
                        queryData.id
                    )}
                </strong>

            </div>

        </div>



        <div class="query-card-info">


            <div class="info-item">

                <span>
                    Student
                </span>

                <strong>
                    ${escapeHTML(
                        queryData.studentId ||
                        "Not available"
                    )}
                </strong>

            </div>


            <div class="info-item">

                <span>
                    Department
                </span>

                <strong>
                    ${escapeHTML(
                        queryData.department ||
                        "General"
                    )}
                </strong>

            </div>


            <div class="info-item">

                <span>
                    Course
                </span>

                <strong>
                    ${escapeHTML(
                        queryData.course ||
                        "Not specified"
                    )}
                </strong>

            </div>


            <div class="info-item">

                <span>
                    Assigned Faculty
                </span>

                <strong>
                    ${escapeHTML(
                        facultyName
                    )}
                </strong>

            </div>


        </div>



        <div class="query-card-footer">


            <div class="ai-info">

                <span class="ai-badge">

                    ${aiLabel}

                </span>


                ${
                    queryData.aiConfidence !== undefined
                        ? `
                            <span>
                                AI Confidence:
                                <strong>
                                    ${formatConfidence(
                                        queryData.aiConfidence
                                    )}
                                </strong>
                            </span>
                          `
                        : ""
                }

            </div>



            <div class="card-actions">

    <button
        class="view-button"
        data-action="view"
    >
        View Details
    </button>

    <button
        class="reassign-button"
        data-action="reassign"
    >
        Reassign
    </button>

    <button
        class="status-button"
        data-action="status"
    >
        Change Status
    </button>

    <button
        class="delete-button"
        data-action="delete"
    >
        Delete
    </button>

</div>


        </div>

    `;



    /* VIEW */

    article
        .querySelector(
            '[data-action="view"]'
        )
        .addEventListener(
            "click",
            () => {

                openDetailsModal(
                    queryData
                );

            }
        );



    /* REASSIGN */

    article
        .querySelector(
            '[data-action="reassign"]'
        )
        .addEventListener(
            "click",
            () => {

                openReassignModal(
                    queryData
                );

            }
        );



    /* STATUS */

    article
        .querySelector(
            '[data-action="status"]'
        )
        .addEventListener(
            "click",
            () => {

                openStatusModal(
                    queryData
                );

            }
        );
/* DELETE */

article
    .querySelector(
        '[data-action="delete"]'
    )
    .addEventListener(
        "click",
        () => {

            deleteQuery(
                queryData
            );

        }
    );

    return article;

}

/* =========================================
   DELETE QUERY
========================================= */

async function deleteQuery(
    queryData
) {

    const queryTitle =
        queryData.title ||
        "this query";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${queryTitle}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "queries",
                queryData.id
            )

        );


        /* Remove from local array */

        allQueries =
            allQueries.filter(
                item =>
                    item.id !==
                    queryData.id
            );


        /* Refresh statistics */

        updateStatistics();


        /* Refresh displayed list */

        applyFilters();


        showToast(
            "Query deleted successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Delete query error:",
            error
        );


        showToast(
            "Unable to delete the query.",
            "error"
        );

    }

}


/* =========================================
   DETAILS MODAL
========================================= */

function openDetailsModal(
    queryData
) {

    selectedQuery =
        queryData;


    document.getElementById(
        "detailsQueryId"
    ).textContent =
        `Query ID: ${queryData.id}`;


    const assignedFaculty =
        findFaculty(
            queryData.assignedFacultyId
        );


    const facultyName =
        assignedFaculty
            ? assignedFaculty.name
            : "Unassigned";


    const facultyDepartment =
        assignedFaculty
            ? assignedFaculty.department
            : "-";


    const status =
        getStatusInfo(
            queryData.status
        );


    document.getElementById(
        "detailsContent"
    ).innerHTML = `

        <div class="details-title">

            <h3>
                ${escapeHTML(
                    queryData.title ||
                    "Untitled Query"
                )}
            </h3>

            <span
                class="status-badge ${status.className}"
            >
                ${status.label}
            </span>

        </div>


        <div class="details-section">

            <h4>
                Query Information
            </h4>


            <div class="details-grid">

                ${detailItem(
                    "Student ID",
                    queryData.studentId
                )}

                ${detailItem(
                    "Department",
                    queryData.department
                )}

                ${detailItem(
                    "Course",
                    queryData.course
                )}

                ${detailItem(
                    "Priority",
                    capitalize(
                        queryData.priority ||
                        "Not specified"
                    )
                )}

                ${detailItem(
                    "Created",
                    formatFullDate(
                        queryData.createdAt
                    )
                )}

                ${detailItem(
                    "Resolved",
                    queryData.resolvedAt
                        ? formatFullDate(
                            queryData.resolvedAt
                        )
                        : "Not resolved"
                )}

            </div>

        </div>



        <div class="details-section">

            <h4>
                Description
            </h4>

            <div class="description-box">

                ${escapeHTML(
                    queryData.description ||
                    "No description provided."
                )}

            </div>

        </div>



        <div class="details-section">

            <h4>
                Assignment
            </h4>


            <div class="details-grid">

                ${detailItem(
                    "Assigned Faculty",
                    facultyName
                )}

                ${detailItem(
                    "Faculty Department",
                    facultyDepartment
                )}

                ${detailItem(
                    "Assignment Status",
                    queryData.assignmentStatus ||
                    "Not available"
                )}

                ${detailItem(
                    "Assignment Method",
                    queryData.assignmentMethod ||
                    "Not available"
                )}

                ${detailItem(
                    "Assignment Confidence",
                    queryData.assignmentConfidence !== undefined &&
                    queryData.assignmentConfidence !== null
                        ? formatConfidence(
                            queryData.assignmentConfidence
                        )
                        : "Not available"
                )}

            </div>

        </div>



        <div class="details-section">

            <h4>
                AI Processing
            </h4>


            <div class="details-grid">

                ${detailItem(
                    "AI Processed",
                    queryData.aiProcessed === true
                        ? "Yes"
                        : "No"
                )}

                ${detailItem(
                    "AI Answered",
                    queryData.aiAnswered === true
                        ? "Yes"
                        : "No"
                )}

                ${detailItem(
                    "AI Confidence",
                    queryData.aiConfidence !== undefined &&
                    queryData.aiConfidence !== null
                        ? formatConfidence(
                            queryData.aiConfidence
                        )
                        : "Not available"
                )}

                ${detailItem(
                    "Similar Query ID",
                    queryData.similiarQueryId ||
                    "None"
                )}

                ${detailItem(
                    "Escalation Reason",
                    queryData.aiEscalationReason ||
                    "None"
                )}

            </div>

        </div>

    `;


    document.getElementById(
        "detailsModal"
    ).classList.add(
        "show"
    );

}



/* =========================================
   DETAIL ITEM
========================================= */

function detailItem(
    label,
    value
) {

    return `

        <div class="detail-item">

            <span>
                ${escapeHTML(
                    label
                )}
            </span>

            <strong>
                ${escapeHTML(
                    String(
                        value ||
                        "-"
                    )
                )}
            </strong>

        </div>

    `;

}



/* =========================================
   REASSIGN MODAL
========================================= */

function openReassignModal(
    queryData
) {

    selectedQuery =
        queryData;


    const assignedFaculty =
        findFaculty(
            queryData.assignedFacultyId
        );


    document.getElementById(
        "reassignQueryTitle"
    ).textContent =
        queryData.title ||
        "Untitled Query";


    document.getElementById(
        "currentFacultyText"
    ).textContent =
        `Currently assigned: ${
            assignedFaculty
                ? assignedFaculty.name
                : "Unassigned"
        }`;


    const select =
        document.getElementById(
            "facultySelect"
        );


    select.value =
        "";


    document.getElementById(
        "facultyInfo"
    ).style.display =
        "none";


    document.getElementById(
        "reassignModal"
    ).classList.add(
        "show"
    );

}



/* =========================================
   FACULTY SELECTION
========================================= */

document.getElementById(
    "facultySelect"
).addEventListener(
    "change",
    event => {

        const uid =
            event.target.value;


        const faculty =
            findFaculty(
                uid
            );


        const facultyInfo =
            document.getElementById(
                "facultyInfo"
            );


        if (!faculty) {

            facultyInfo.style.display =
                "none";

            return;

        }


        facultyInfo.innerHTML = `

            <strong>
                ${escapeHTML(
                    faculty.name ||
                    "Unnamed Faculty"
                )}
            </strong>

            <span>
                Faculty ID:
                ${escapeHTML(
                    faculty.facultyId ||
                    "-"
                )}
            </span>

            <span>
                Department:
                ${escapeHTML(
                    faculty.department ||
                    "-"
                )}
            </span>

            <span>
                Designation:
                ${escapeHTML(
                    faculty.designation ||
                    "-"
                )}
            </span>

        `;


        facultyInfo.style.display =
            "flex";

    }
);



/* =========================================
   CONFIRM REASSIGNMENT
========================================= */

document.getElementById(
    "confirmReassignButton"
).addEventListener(
    "click",
    async () => {

        if (!selectedQuery) {

            showToast(
                "No query selected.",
                "error"
            );

            return;

        }


        const selectedUid =
            document.getElementById(
                "facultySelect"
            ).value;


        if (!selectedUid) {

            showToast(
                "Please select a faculty member.",
                "error"
            );

            return;

        }


        const faculty =
            findFaculty(
                selectedUid
            );


        if (!faculty) {

            showToast(
                "Selected faculty is not available.",
                "error"
            );

            return;

        }


        const button =
            document.getElementById(
                "confirmReassignButton"
            );


        button.disabled =
            true;


        button.textContent =
            "Reassigning...";


        try {

            await updateDoc(

                doc(
                    db,
                    "queries",
                    selectedQuery.id
                ),

                {

                    assignedFacultyId:
                        faculty.uid,

                    assignmentStatus:
                        "assigned",

                    assignmentMethod:
                        "admin"

                }

            );


            const localQuery =
                allQueries.find(
                    item =>
                        item.id ===
                        selectedQuery.id
                );


            if (localQuery) {

                localQuery.assignedFacultyId =
                    faculty.uid;

                localQuery.assignmentStatus =
                    "assigned";

                localQuery.assignmentMethod =
                    "admin";

            }


            selectedQuery =
                localQuery ||
                selectedQuery;


            closeModal(
                "reassignModal"
            );


            closeModal(
                "detailsModal"
            );


            updateStatistics();

            applyFilters();


            showToast(
                `Query reassigned to ${faculty.name}.`,
                "success"
            );

        }

        catch (error) {

            console.error(
                "Reassignment error:",
                error
            );


            showToast(
                "Unable to reassign query.",
                "error"
            );

        }

        finally {

            button.disabled =
                false;

            button.textContent =
                "Reassign Query";

        }

    }
);



/* =========================================
   STATUS MODAL
========================================= */

function openStatusModal(
    queryData
) {

    selectedQuery =
        queryData;


    document.getElementById(
        "newStatus"
    ).value =
        queryData.status ||
        "pending";


    document.getElementById(
        "statusModal"
    ).classList.add(
        "show"
    );

}



/* =========================================
   CONFIRM STATUS
========================================= */

document.getElementById(
    "confirmStatusButton"
).addEventListener(
    "click",
    async () => {

        if (!selectedQuery) {

            return;

        }


        const newStatus =
            document.getElementById(
                "newStatus"
            ).value;


        const button =
            document.getElementById(
                "confirmStatusButton"
            );


        button.disabled =
            true;


        button.textContent =
            "Updating...";


        try {

            const updateData = {

                status:
                    newStatus

            };


            if (
                newStatus ===
                "resolved"
            ) {

                updateData.resolvedAt =
                    new Date()
                        .toISOString();

            }

            else {

                updateData.resolvedAt =
                    null;

            }


            await updateDoc(

                doc(
                    db,
                    "queries",
                    selectedQuery.id
                ),

                updateData

            );


            const localQuery =
                allQueries.find(
                    item =>
                        item.id ===
                        selectedQuery.id
                );


            if (localQuery) {

                localQuery.status =
                    newStatus;

                localQuery.resolvedAt =
                    updateData.resolvedAt;

            }


            closeModal(
                "statusModal"
            );


            closeModal(
                "detailsModal"
            );


            updateStatistics();

            applyFilters();


            showToast(
                "Query status updated successfully.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Status update error:",
                error
            );


            showToast(
                "Unable to update query status.",
                "error"
            );

        }

        finally {

            button.disabled =
                false;

            button.textContent =
                "Update Status";

        }

    }
);



/* =========================================
   DETAILS MODAL ACTIONS
========================================= */

document.getElementById(
    "detailsReassignButton"
).addEventListener(
    "click",
    () => {

        if (!selectedQuery) {

            return;

        }


        closeModal(
            "detailsModal"
        );


        openReassignModal(
            selectedQuery
        );

    }
);



document.getElementById(
    "detailsStatusButton"
).addEventListener(
    "click",
    () => {

        if (!selectedQuery) {

            return;

        }


        closeModal(
            "detailsModal"
        );


        openStatusModal(
            selectedQuery
        );

    }
);



/* =========================================
   CLOSE BUTTONS
========================================= */

document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset.close
                    );

                }
            );

        }
    );



/* =========================================
   CLOSE MODAL ON BACKDROP
========================================= */

document
    .querySelectorAll(
        ".modal-overlay"
    )
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }
    );



/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal-overlay.show"
                )
                .forEach(
                    modal => {

                        modal.classList.remove(
                            "show"
                        );

                    }
                );

        }

    }
);



/* =========================================
   CLOSE MODAL
========================================= */

function closeModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}



/* =========================================
   SEARCH / FILTER EVENTS
========================================= */

searchInput.addEventListener(
    "input",
    applyFilters
);


statusFilter.addEventListener(
    "change",
    applyFilters
);


departmentFilter.addEventListener(
    "change",
    applyFilters
);


priorityFilter.addEventListener(
    "change",
    applyFilters
);


assignmentFilter.addEventListener(
    "change",
    applyFilters
);


aiFilter.addEventListener(
    "change",
    applyFilters
);



/* =========================================
   REFRESH
========================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        refreshButton.disabled =
            true;


        refreshButton.textContent =
            "Refreshing...";


        try {

            await Promise.all([

                loadFaculty(),

                loadQueries()

            ]);


            showToast(
                "Queries refreshed.",
                "success"
            );

        }

        finally {

            refreshButton.disabled =
                false;

            refreshButton.textContent =
                "Refresh";

        }

    }
);



/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
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



/* =========================================
   FIND FACULTY
========================================= */

function findFaculty(
    uid
) {

    if (!uid) {

        return null;

    }


    return allFaculty.find(
        faculty =>
            faculty.uid ===
            uid
    ) || null;

}



/* =========================================
   STATUS
========================================= */

function getStatusInfo(
    status
) {

    switch (
        normalize(
            status
        )
    ) {

        case "pending":

            return {

                label:
                    "PENDING",

                className:
                    "status-pending"

            };


        case "in-progress":

            return {

                label:
                    "IN PROGRESS",

                className:
                    "status-progress"

            };


        case "resolved":

            return {

                label:
                    "RESOLVED",

                className:
                    "status-resolved"

            };


        default:

            return {

                label:
                    status
                        ? String(
                            status
                        ).toUpperCase()
                        : "UNKNOWN",

                className:
                    "status-default"

            };

    }

}



/* =========================================
   DATE
========================================= */

function getTimestamp(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    const date =
        new Date(
            value
        );


    return isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();

}



/* =========================================
   RELATIVE TIME
========================================= */

function formatRelativeTime(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {

        return "Unknown date";

    }


    const difference =
        Date.now() -
        timestamp;


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (
        minutes < 1
    ) {

        return "Just now";

    }


    if (
        minutes < 60
    ) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours < 24
    ) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    if (
        days < 30
    ) {

        return `${days}d ago`;

    }


    return new Date(
        timestamp
    ).toLocaleDateString();

}



/* =========================================
   FULL DATE
========================================= */

function formatFullDate(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {

        return "Not available";

    }


    return new Date(
        timestamp
    ).toLocaleString(
        "en-IN",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}



/* =========================================
   CONFIDENCE
========================================= */

function formatConfidence(
    value
) {

    let number =
        Number(
            value
        );


    if (
        isNaN(number)
    ) {

        return "N/A";

    }


    if (
        number <= 1
    ) {

        number *=
            100;

    }


    return `${number.toFixed(1)}%`;

}



/* =========================================
   NORMALIZE
========================================= */

function normalize(
    value
) {

    return String(
        value ||
        ""
    )
        .trim()
        .toLowerCase();

}



/* =========================================
   CAPITALIZE
========================================= */

function capitalize(
    value
) {

    if (!value) {

        return "";

    }


    return String(
        value
    )
        .charAt(0)
        .toUpperCase()
        +
        String(
            value
        )
            .slice(1);

}



/* =========================================
   TRUNCATE
========================================= */

function truncate(
    text,
    length
) {

    const value =
        String(
            text ||
            ""
        );


    if (
        value.length <=
        length
    ) {

        return value;

    }


    return (
        value.substring(
            0,
            length
        )
        +
        "..."
    );

}



/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(
    value
) {

    return String(
        value ||
        ""
    )
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
   TOAST
========================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.className =
        `toast ${type} show`;


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}