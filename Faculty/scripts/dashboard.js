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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

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
   INITIALIZE
===================================================== */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =====================================================
   GLOBAL DATA
===================================================== */

let assignedQueries = [];

let currentFaculty = null;


/* =====================================================
   DOM
===================================================== */

const totalQueries =
    document.getElementById(
        "totalQueries"
    );

const pendingQueries =
    document.getElementById(
        "pendingQueries"
    );

const progressQueries =
    document.getElementById(
        "progressQueries"
    );

const resolvedQueries =
    document.getElementById(
        "resolvedQueries"
    );

const highPriorityQueries =
    document.getElementById(
        "highPriorityQueries"
    );

const queriesContainer =
    document.getElementById(
        "queriesContainer"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../faculty-login.html";

            return;

        }


        console.log(
            "Authenticated Faculty UID:",
            user.uid
        );


        try {

            await loadFacultyProfile(
                user.uid
            );

            await loadAssignedQueries(
                user.uid
            );

        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );

            showError(
                "Unable to load faculty dashboard."
            );

        }

    }
);


/* =====================================================
   LOAD FACULTY PROFILE
===================================================== */

async function loadFacultyProfile(
    uid
) {

    console.log(
        "Loading faculty profile..."
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


    const snapshot =
        await getDocs(
            facultyQuery
        );


    if (
        snapshot.empty
    ) {

        throw new Error(
            "Faculty profile not found."
        );

    }


    currentFaculty =
        snapshot.docs[0].data();


    console.log(
        "Faculty:",
        currentFaculty
    );


    /* =================================
       NAME
    ================================= */

    const name =
        currentFaculty.name ||
        "Faculty";


    document.getElementById(
        "facultyName"
    ).textContent = name;


    document.getElementById(
        "welcomeName"
    ).textContent = name;


    /* =================================
       DEPARTMENT
    ================================= */

    document.getElementById(
        "facultyDepartment"
    ).textContent =
        currentFaculty.department ||
        "Department";


    /* =================================
       PROFILE IMAGE
    ================================= */

    if (
        currentFaculty.profileImg
    ) {

        document.getElementById(
            "facultyAvatar"
        ).src =
            currentFaculty.profileImg;

    }


    /* =================================
       SUBJECTS
    ================================= */

    const subjects =
        Array.isArray(
            currentFaculty.subjects
        )
            ? currentFaculty.subjects
            : [];


    const subjectsList =
        document.getElementById(
            "subjectsList"
        );


    subjectsList.innerHTML =
        "";


    if (
        subjects.length === 0
    ) {

        subjectsList.innerHTML = `
            <span class="subject-loading">
                No subjects assigned
            </span>
        `;

        return;

    }


    subjects.forEach(
        subject => {

            const element =
                document.createElement(
                    "span"
                );

            element.className =
                "subject-tag";

            element.textContent =
                subject;

            subjectsList.appendChild(
                element
            );

        }
    );

}


/* =====================================================
   LOAD ASSIGNED QUERIES
===================================================== */

async function loadAssignedQueries(
    uid
) {

    console.log(
        "Loading assigned queries..."
    );


    /*
       IMPORTANT:

       We query ONLY:

       assignedFacultyId == current Firebase UID
    */

    const queriesQuery =
        query(
            collection(
                db,
                "queries"
            ),
            where(
                "assignedFacultyId",
                "==",
                uid
            )
        );


    const snapshot =
        await getDocs(
            queriesQuery
        );


    assignedQueries =
        snapshot.docs.map(
            document => ({

                id: document.id,

                ...document.data()

            })
        );


    console.log(
        "Assigned queries:",
        assignedQueries.length
    );


    /* =================================
       SORT BY CREATED DATE
    ================================= */

    assignedQueries.sort(
        (a, b) => {

            const dateA =
                getTimestampValue(
                    a.createdAt
                );

            const dateB =
                getTimestampValue(
                    b.createdAt
                );

            return dateB - dateA;

        }
    );


    /* =================================
       DASHBOARD STATS
    ================================= */

    updateStatistics();


    /* =================================
       QUERY LIST
    ================================= */

    renderQueries();


    /* =================================
       SUBJECT BREAKDOWN
    ================================= */

    renderSubjectBreakdown();

}


/* =====================================================
   UPDATE STATISTICS
===================================================== */

function updateStatistics() {

    const total =
        assignedQueries.length;


    const pending =
        assignedQueries.filter(
            query =>
                query.status ===
                "pending"
        ).length;


    const progress =
        assignedQueries.filter(
            query =>
                query.status ===
                    "in-progress" ||
                query.status ===
                    "in_progress"
        ).length;


    const resolved =
        assignedQueries.filter(
            query =>
                query.status ===
                "resolved"
        ).length;


    const high =
        assignedQueries.filter(
            query =>
                query.priority ===
                "high"
        ).length;


    totalQueries.textContent =
        total;


    pendingQueries.textContent =
        pending;


    progressQueries.textContent =
        progress;


    resolvedQueries.textContent =
        resolved;


    highPriorityQueries.textContent =
        high;


    /* =================================
       OVERVIEW
    ================================= */

    document.getElementById(
        "overviewPending"
    ).textContent = pending;


    document.getElementById(
        "overviewProgress"
    ).textContent = progress;


    document.getElementById(
        "overviewResolved"
    ).textContent = resolved;


    const denominator =
        total || 1;


    document.getElementById(
        "pendingBar"
    ).style.width =
        `${(pending / denominator) * 100}%`;


    document.getElementById(
        "progressBar"
    ).style.width =
        `${(progress / denominator) * 100}%`;


    document.getElementById(
        "resolvedBar"
    ).style.width =
        `${(resolved / denominator) * 100}%`;

}


/* =====================================================
   RENDER QUERIES
===================================================== */

function renderQueries() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value;


    const priority =
        priorityFilter.value;


    let filtered =
        assignedQueries.filter(
            query => {

                /* SEARCH */

                const matchesSearch =
                    !search ||
                    String(
                        query.title || ""
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        query.description || ""
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        query.course || ""
                    )
                        .toLowerCase()
                        .includes(search);


                /* STATUS */

                const matchesStatus =
                    status === "all" ||
                    query.status === status ||
                    (
                        status ===
                        "in-progress" &&
                        query.status ===
                        "in_progress"
                    );


                /* PRIORITY */

                const matchesPriority =
                    priority === "all" ||
                    query.priority === priority;


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority
                );

            }
        );


    /* Show only recent 5 */

    filtered =
        filtered.slice(
            0,
            5
        );


    if (
        filtered.length === 0
    ) {

        queriesContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h4>
                    No assigned queries
                </h4>

                <p>
                    There are no queries matching your current filters.
                </p>

            </div>

        `;

        return;

    }


    queriesContainer.innerHTML =
        filtered
            .map(
                query => createQueryHTML(
                    query
                )
            )
            .join("");


    /* =================================
       CLICK EVENTS
    ================================= */

    document
        .querySelectorAll(
            ".query-item"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const id =
                            element.dataset.id;

                        const queryData =
                            assignedQueries.find(
                                item =>
                                    item.id === id
                            );


                        if (
                            queryData
                        ) {

                            openQueryModal(
                                queryData
                            );

                        }

                    }
                );

            }
        );

}


/* =====================================================
   QUERY HTML
===================================================== */

function createQueryHTML(
    query
) {

    const status =
        query.status ||
        "pending";


    const priority =
        query.priority ||
        "medium";


    const date =
        formatDate(
            query.createdAt
        );


    return `

        <div
            class="query-item"
            data-id="${escapeHTML(query.id)}"
        >

            <div class="query-top">

                <h4 class="query-title">
                    ${escapeHTML(
                        query.title ||
                        "Untitled Query"
                    )}
                </h4>


                <div class="query-badges">

                    <span
                        class="badge ${getStatusClass(status)}"
                    >
                        ${escapeHTML(
                            formatStatus(status)
                        )}
                    </span>


                    <span
                        class="badge ${getPriorityClass(priority)}"
                    >
                        ${escapeHTML(
                            priority
                        )}
                    </span>

                </div>

            </div>


            <p class="query-description">
                ${escapeHTML(
                    query.description ||
                    "No description available."
                )}
            </p>


            <div class="query-meta">

                <span>
                    ${escapeHTML(
                        query.course ||
                        "No course"
                    )}
                </span>

                <span>
                    ${escapeHTML(date)}
                </span>

                <span>
                    ${escapeHTML(
                        query.department ||
                        ""
                    )}
                </span>

            </div>

        </div>

    `;

}


/* =====================================================
   SUBJECT BREAKDOWN
===================================================== */

function renderSubjectBreakdown() {

    const container =
        document.getElementById(
            "subjectBreakdown"
        );


    const counts = {};


    assignedQueries.forEach(
        query => {

            const subject =
                query.course ||
                "Other";


            counts[subject] =
                (
                    counts[subject] ||
                    0
                ) + 1;

        }
    );


    const entries =
        Object.entries(
            counts
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (
        entries.length === 0
    ) {

        container.innerHTML = `
            <div class="loading-small">
                No assigned queries yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        entries
            .slice(0, 6)
            .map(
                ([subject, count]) => `

                    <div class="subject-row">

                        <div class="subject-row-left">

                            <span
                                class="status-dot progress-dot"
                            ></span>

                            <span>
                                ${escapeHTML(subject)}
                            </span>

                        </div>

                        <span class="subject-count">
                            ${count}
                        </span>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   QUERY MODAL
===================================================== */

function openQueryModal(
    query
) {

    document.getElementById(
        "modalTitle"
    ).textContent =
        query.title ||
        "Untitled Query";


    document.getElementById(
        "modalDescription"
    ).textContent =
        query.description ||
        "No description available.";


    document.getElementById(
        "modalCourse"
    ).textContent =
        query.course ||
        "No course";


    document.getElementById(
        "modalDate"
    ).textContent =
        formatDate(
            query.createdAt
        );


    document.getElementById(
        "modalQueryId"
    ).textContent =
        query.id;


    document.getElementById(
        "modalStatus"
    ).textContent =
        formatStatus(
            query.status ||
            "pending"
        );


    document.getElementById(
        "modalPriority"
    ).textContent =
        query.priority ||
        "medium";


    const openButton =
        document.getElementById(
            "openQueryButton"
        );


    openButton.onclick =
        () => {
            window.location.href =
    `open-query.html?id=${encodeURIComponent(query.id)}`;
        };


    document.getElementById(
        "queryModal"
    ).classList.add(
        "active"
    );

}


/* =====================================================
   MODAL CLOSE
===================================================== */

document.getElementById(
    "modalClose"
).addEventListener(
    "click",
    closeModal
);


document.getElementById(
    "queryModal"
).addEventListener(
    "click",
    event => {

        if (
            event.target.id ===
            "queryModal"
        ) {

            closeModal();

        }

    }
);


function closeModal() {

    document.getElementById(
        "queryModal"
    ).classList.remove(
        "active"
    );

}


/* =====================================================
   FILTER EVENTS
===================================================== */

searchInput.addEventListener(
    "input",
    renderQueries
);


statusFilter.addEventListener(
    "change",
    renderQueries
);


priorityFilter.addEventListener(
    "change",
    renderQueries
);


/* =====================================================
   LOGOUT
===================================================== */

document.getElementById(
    "logoutButton"
).addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            sessionStorage.clear();

            window.location.href =
                "../faculty-login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

document.getElementById(
    "mobileMenu"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "sidebar"
        ).classList.toggle(
            "open"
        );

    }
);


/* =====================================================
   NOTIFICATION BUTTON
===================================================== */

document.getElementById(
    "notificationButton"
).addEventListener(
    "click",
    () => {

        window.location.href =
            "notifications.html";

    }
);


/* =====================================================
   HELPERS
===================================================== */

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

        return (
            timestamp.seconds *
            1000
        );

    }


    return 0;

}


function formatDate(
    timestamp
) {

    const value =
        getTimestampValue(
            timestamp
        );


    if (!value) {

        return "Unknown date";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(
        new Date(value)
    );

}


function formatStatus(
    status
) {

    if (
        status ===
        "in-progress" ||
        status ===
        "in_progress"
    ) {

        return "In Progress";

    }


    return String(
        status
    )
        .replace(
            /-/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


function getStatusClass(
    status
) {

    if (
        status ===
        "in-progress" ||
        status ===
        "in_progress"
    ) {

        return "in-progress";

    }


    if (
        status ===
        "resolved"
    ) {

        return "resolved";

    }


    return "pending";

}


function getPriorityClass(
    priority
) {

    if (
        priority === "high"
    ) {

        return "high";

    }


    if (
        priority === "low"
    ) {

        return "low";

    }


    return "medium";

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
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


function showError(
    message
) {

    queriesContainer.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ⚠
            </div>

            <h4>
                Something went wrong
            </h4>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}