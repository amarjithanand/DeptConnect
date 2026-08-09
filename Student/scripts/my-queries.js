/* =========================================
   FIREBASE IMPORTS
========================================= */

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


/* =========================================
   FIREBASE CONFIGURATION
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

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================
   DOM ELEMENTS
========================================= */

const queryList =
    document.getElementById("queryList");

const noResults =
    document.getElementById("noResults");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const departmentFilter =
    document.getElementById("departmentFilter");

const dateFilter =
    document.getElementById("dateFilter");

const clearFilters =
    document.getElementById("clearFilters");

const sortFilter =
    document.getElementById("sortFilter");

const resultCount =
    document.getElementById("resultCount");

const totalCount =
    document.getElementById("totalCount");

const pendingCount =
    document.getElementById("pendingCount");

const aiCount =
    document.getElementById("aiCount");

const progressCount =
    document.getElementById("progressCount");


/* =========================================
   GLOBAL DATA
========================================= */

let allQueries = [];


/*
 * Map:
 *
 * queryId
 *    ↓
 * faculty response object
 *
 * Example:
 *
 * facultyResponses.get("abc123")
 */

let facultyResponses =
    new Map();


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            console.log(
                "No authenticated user."
            );

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Authenticated UID:",
            user.uid
        );


        await loadStudentQueries(
            user.uid
        );

    }
);


/* =========================================
   LOAD CURRENT STUDENT QUERIES
========================================= */

async function loadStudentQueries(
    uid
) {

    try {

        console.log(
            "Loading student queries..."
        );


        console.log(
            "Querying queries collection with UID:",
            uid
        );


        /*
         * Current queries structure:
         *
         * queries/{documentId}
         *
         * uid:
         * "student Firebase Auth UID"
         */

        const queryRef =
            query(
                collection(
                    db,
                    "queries"
                ),
                where(
                    "uid",
                    "==",
                    uid
                )
            );


        const snapshot =
            await getDocs(
                queryRef
            );


        console.log(
            "Queries found:",
            snapshot.size
        );


        /* =============================
           RESET QUERY DATA
        ============================= */

        allQueries = [];


        /* =============================
           READ QUERY DOCUMENTS
        ============================= */

        snapshot.forEach(
            document => {

                allQueries.push({

                    id:
                        document.id,

                    ...document.data()

                });

            }
        );


        /* =============================
           LOAD FACULTY RESPONSES
        ============================= */

        await loadFacultyResponses(
            uid
        );


        /* =============================
           ATTACH RESPONSE TO QUERY
        ============================= */

        allQueries =
            allQueries.map(
                queryData => {

                    return {

                        ...queryData,

                        facultyResponse:
                            facultyResponses.get(
                                queryData.id
                            ) || null

                    };

                }
            );


        console.log(
            "Queries with responses:",
            allQueries
        );


        /* =============================
           SORT NEWEST FIRST
        ============================= */

        allQueries.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.createdAt
                    )
                    -
                    getTimestamp(
                        a.createdAt
                    )
                );

            }
        );


        /* =============================
           UPDATE STATISTICS
        ============================= */

        updateStatistics();


        /* =============================
           DEPARTMENT FILTER
        ============================= */

        populateDepartmentFilter();


        /* =============================
           DISPLAY QUERIES
        ============================= */

        applyFilters();


    } catch (error) {

        console.error(
            "Error loading queries:",
            error
        );


        queryList.innerHTML =
            "";


        noResults.style.display =
            "block";


        const heading =
            noResults.querySelector(
                "h3"
            );


        const paragraph =
            noResults.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "Unable to load queries";

        }


        if (paragraph) {

            paragraph.textContent =
                "Please check your connection and try again.";

        }

    }

}


/* =========================================
   LOAD FACULTY RESPONSES
========================================= */

async function loadFacultyResponses(
    uid
) {

    try {

        console.log(
            "Loading faculty responses..."
        );


        facultyResponses =
            new Map();


        /*
         * Expected responses structure:
         *
         * responses/{responseId}
         *
         * uid
         * facultyId
         * facultyName
         * queryId
         * studentId
         * studentUid
         * queryTitle
         * queryDescription
         * course
         * department
         * priority
         * response
         * respondedAt
         * status
         *
         *
         * IMPORTANT:
         *
         * studentUid must contain the
         * student's Firebase Auth UID.
         */

        const responseQuery =
            query(
                collection(
                    db,
                    "responses"
                ),
                where(
                    "studentUid",
                    "==",
                    uid
                )
            );


        const snapshot =
            await getDocs(
                responseQuery
            );


        console.log(
            "Faculty responses found:",
            snapshot.size
        );


        snapshot.forEach(
            document => {

                const responseData =
                    document.data();


                console.log(
                    "Response document:",
                    document.id,
                    responseData
                );


                /*
                 * queryId connects the response
                 * to the original query.
                 */

                if (
                    responseData.queryId
                ) {

                    facultyResponses.set(
                        responseData.queryId,
                        {

                            id:
                                document.id,

                            ...responseData

                        }
                    );

                }

            }
        );


        console.log(
            "Faculty response map:",
            facultyResponses
        );


    } catch (error) {

        console.error(
            "Error loading faculty responses:",
            error
        );


        /*
         * Do not prevent the query list
         * from loading if responses fail.
         */

        facultyResponses =
            new Map();

    }

}


/* =========================================
   UPDATE STATISTICS
========================================= */

function updateStatistics() {

    const total =
        allQueries.length;


    const pending =
        allQueries.filter(
            queryData =>
                queryData.status ===
                "pending"
        ).length;


    const aiResolved =
        allQueries.filter(
            queryData =>
                queryData.aiAnswered ===
                true
        ).length;


    const inProgress =
        allQueries.filter(
            queryData =>
                queryData.status ===
                "in-progress"
        ).length;


    if (totalCount) {

        totalCount.textContent =
            total;

    }


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }


    if (aiCount) {

        aiCount.textContent =
            aiResolved;

    }


    if (progressCount) {

        progressCount.textContent =
            inProgress;

    }

}


/* =========================================
   POPULATE DEPARTMENT FILTER
========================================= */

function populateDepartmentFilter() {

    if (!departmentFilter) {

        return;

    }


    const departments =
        [
            ...new Set(
                allQueries
                    .map(
                        queryData =>
                            queryData.department
                    )
                    .filter(Boolean)
            )
        ];


    departmentFilter.innerHTML = `
        <option value="all">
            All Departments
        </option>
    `;


    departments.sort();


    departments.forEach(
        department => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                normalizeValue(
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
   APPLY FILTERS
========================================= */

function applyFilters() {

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const selectedDepartment =
        departmentFilter
            ? departmentFilter.value
            : "all";


    const selectedDate =
        dateFilter
            ? dateFilter.value
            : "all";


    let filteredQueries =
        [...allQueries];


    /* =============================
       SEARCH
    ============================= */

    if (searchTerm) {

        filteredQueries =
            filteredQueries.filter(
                queryData => {

                    const title =
                        (
                            queryData.title ||
                            ""
                        ).toLowerCase();


                    const description =
                        (
                            queryData.description ||
                            ""
                        ).toLowerCase();


                    const course =
                        (
                            queryData.course ||
                            ""
                        ).toLowerCase();


                    const department =
                        (
                            queryData.department ||
                            ""
                        ).toLowerCase();


                    return (
                        title.includes(
                            searchTerm
                        )
                        ||
                        description.includes(
                            searchTerm
                        )
                        ||
                        course.includes(
                            searchTerm
                        )
                        ||
                        department.includes(
                            searchTerm
                        )
                    );

                }
            );

    }


    /* =============================
       STATUS FILTER
    ============================= */

    if (
        selectedStatus !==
        "all"
    ) {

        filteredQueries =
            filteredQueries.filter(
                queryData =>
                    matchesStatus(
                        queryData,
                        selectedStatus
                    )
            );

    }


    /* =============================
       DEPARTMENT FILTER
    ============================= */

    if (
        selectedDepartment !==
        "all"
    ) {

        filteredQueries =
            filteredQueries.filter(
                queryData => {

                    return (
                        normalizeValue(
                            queryData.department
                        )
                        ===
                        selectedDepartment
                    );

                }
            );

    }


    /* =============================
       DATE FILTER
    ============================= */

    if (
        selectedDate !==
        "all"
    ) {

        filteredQueries =
            filteredQueries.filter(
                queryData => {

                    return matchesDateFilter(
                        queryData.createdAt,
                        selectedDate
                    );

                }
            );

    }


    /* =============================
       SORT
    ============================= */

    if (
        sortFilter &&
        sortFilter.value ===
        "oldest"
    ) {

        filteredQueries.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        a.createdAt
                    )
                    -
                    getTimestamp(
                        b.createdAt
                    )
                );

            }
        );

    } else {

        filteredQueries.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.createdAt
                    )
                    -
                    getTimestamp(
                        a.createdAt
                    )
                );

            }
        );

    }


    renderQueries(
        filteredQueries
    );

}


/* =========================================
   STATUS MATCHING
========================================= */

function matchesStatus(
    queryData,
    selectedStatus
) {

    switch (
        selectedStatus
    ) {

        case "pending":

            return (
                queryData.status ===
                "pending"
                &&
                queryData.aiAnswered !==
                true
            );


        case "ai-resolved":

            return (
                queryData.aiAnswered ===
                true
            );


        case "in-progress":

            return (
                queryData.status ===
                "in-progress"
            );


        case "resolved":

            return (
                queryData.status ===
                "resolved"
            );


        default:

            return true;

    }

}


/* =========================================
   RENDER QUERIES
========================================= */

function renderQueries(
    queries
) {

    queryList.innerHTML =
        "";


    if (resultCount) {

        resultCount.textContent =
            `Showing ${queries.length} ${
                queries.length === 1
                    ? "query"
                    : "queries"
            }`;

    }


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

            const card =
                createQueryCard(
                    queryData
                );


            queryList.appendChild(
                card
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


    const aiResolved =
        queryData.aiAnswered ===
        true;


    /*
     * Faculty-resolved means:
     *
     * status = resolved
     * AND
     * aiAnswered is not true
     */

    const facultyResolved =
        queryData.status ===
        "resolved"
        &&
        queryData.aiAnswered !==
        true;


    const facultyResponse =
        queryData.facultyResponse ||
        null;


    const statusInfo =
        getStatusInfo(
            queryData
        );


    const createdTime =
        formatRelativeTime(
            queryData.createdAt
        );


    const department =
        queryData.department ||
        "General";


    const course =
        queryData.course ||
        "Not specified";


    const priority =
        queryData.priority ||
        "medium";


    article.className =
        aiResolved
            ? "query-card ai-card"
            : facultyResolved
                ? "query-card resolved-card"
                : "query-card";


    article.dataset.id =
        queryData.id;


    article.dataset.status =
        getFilterStatus(
            queryData
        );


    article.dataset.department =
        normalizeValue(
            department
        );


    article.dataset.title =
        queryData.title ||
        "";


    article.innerHTML = `

        <div class="query-card-top">

            <div class="query-info">

                <div class="query-meta">

                    <span class="status ${statusInfo.className}">
                        ${statusInfo.label}
                    </span>

                    <span>
                        ${escapeHTML(course)}
                    </span>

                    <span>
                        •
                    </span>

                    <span>
                        ${escapeHTML(createdTime)}
                    </span>

                </div>


                <h2>
                    ${escapeHTML(
                        queryData.title ||
                        "Untitled Query"
                    )}
                </h2>


                <p>
                    ${escapeHTML(
                        queryData.description ||
                        "No description provided."
                    )}
                </p>

            </div>


            <div class="query-arrow">
                ›
            </div>

        </div>


        <div class="query-card-bottom">

            <span>
                Department:
                <strong>
                    ${escapeHTML(
                        department
                    )}
                </strong>
            </span>


            ${
                aiResolved
                    ? `
                        <span class="instant">
                            ✓ Answer available instantly
                        </span>
                      `
                    : facultyResolved
                        ? `
                            <span class="instant faculty-available">
                                ✓ Faculty response available
                            </span>
                          `
                        : `
                            <span>
                                Priority:
                                <strong>
                                    ${escapeHTML(
                                        capitalize(
                                            priority
                                        )
                                    )}
                                </strong>
                            </span>
                          `
            }


            <div class="card-actions">

                ${
                    aiResolved
                        ? `
                            <button
                                class="solution-button"
                                data-action="solution"
                                type="button"
                            >
                                View AI Solution
                            </button>
                          `
                        : facultyResolved &&
                          facultyResponse
                            ? `
                                <button
                                    class="solution-button faculty-response-button"
                                    data-action="faculty-response"
                                    type="button"
                                >
                                    View Faculty Response
                                </button>
                              `
                            : ""
                }


                <button
                    class="details-button"
                    data-action="details"
                    type="button"
                >
                    ${
                        aiResolved ||
                        facultyResolved
                            ? "Details"
                            : "View Details"
                    }
                </button>

            </div>

        </div>

    `;


    /* =============================
       DETAILS BUTTON
    ============================= */

    const detailsButton =
        article.querySelector(
            '[data-action="details"]'
        );


    if (detailsButton) {

        detailsButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                openDetailsModal(
                    queryData
                );

            }
        );

    }


    /* =============================
       AI SOLUTION BUTTON
    ============================= */

    const solutionButton =
        article.querySelector(
            '[data-action="solution"]'
        );


    if (solutionButton) {

        solutionButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                openSolutionModal(
                    queryData
                );

            }
        );

    }


    /* =============================
       FACULTY RESPONSE BUTTON
    ============================= */

    const facultyResponseButton =
        article.querySelector(
            '[data-action="faculty-response"]'
        );


    if (facultyResponseButton) {

        facultyResponseButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                openFacultyResponseModal(
                    queryData
                );

            }
        );

    }


    /* =============================
       CARD CLICK
    ============================= */

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
                queryData
            );

        }
    );


    return article;

}


/* =========================================
   STATUS INFORMATION
========================================= */

function getStatusInfo(
    queryData
) {

    /*
     * AI takes priority.
     */

    if (
        queryData.aiAnswered ===
        true
    ) {

        return {

            label:
                "✨ AI RESOLVED",

            className:
                "ai-status"

        };

    }


    switch (
        queryData.status
    ) {

        case "pending":

            return {

                label:
                    "AWAITING FACULTY",

                className:
                    "awaiting"

            };


        case "in-progress":

            return {

                label:
                    "IN PROGRESS",

                className:
                    "assigned"

            };


        case "resolved":

            return {

                label:
                    "RESOLVED",

                className:
                    "resolved"

            };


        default:

            return {

                label:
                    String(
                        queryData.status ||
                        "PENDING"
                    ).toUpperCase(),

                className:
                    "awaiting"

            };

    }

}


/* =========================================
   FILTER STATUS
========================================= */

function getFilterStatus(
    queryData
) {

    if (
        queryData.aiAnswered ===
        true
    ) {

        return "ai-resolved";

    }


    return (
        queryData.status ||
        "pending"
    );

}


/* =========================================
   DETAILS MODAL
========================================= */

function openDetailsModal(
    queryData
) {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    if (!modal) {

        console.warn(
            "detailsModal not found."
        );

        return;

    }


    const status =
        document.getElementById(
            "detailsStatus"
        );


    const statusInfo =
        getStatusInfo(
            queryData
        );


    if (status) {

        status.textContent =
            statusInfo.label;


        status.className =
            `status ${statusInfo.className}`;

    }


    const detailsId =
        document.getElementById(
            "detailsId"
        );


    if (detailsId) {

        detailsId.textContent =
            `Query #${shortQueryId(
                queryData.id
            )}`;

    }


    const detailsTitle =
        document.getElementById(
            "detailsTitle"
        );


    if (detailsTitle) {

        detailsTitle.textContent =
            queryData.title ||
            "Untitled Query";

    }


    const detailsDepartment =
        document.getElementById(
            "detailsDepartment"
        );


    if (detailsDepartment) {

        detailsDepartment.textContent =
            queryData.department ||
            "Not specified";

    }


    const detailsSubject =
        document.getElementById(
            "detailsSubject"
        );


    if (detailsSubject) {

        detailsSubject.textContent =
            queryData.course ||
            "Not specified";

    }


    const detailsDate =
        document.getElementById(
            "detailsDate"
        );


    if (detailsDate) {

        detailsDate.textContent =
            formatFullDate(
                queryData.createdAt
            );

    }


    const detailsPriority =
        document.getElementById(
            "detailsPriority"
        );


    if (detailsPriority) {

        detailsPriority.textContent =
            capitalize(
                queryData.priority ||
                "medium"
            );

    }


    const detailsDescription =
        document.getElementById(
            "detailsDescription"
        );


    if (detailsDescription) {

        detailsDescription.textContent =
            queryData.description ||
            "No description provided.";

    }


    updateTimeline(
        queryData
    );


    modal.classList.add(
        "show"
    );

}


/* =========================================
   TIMELINE
========================================= */

function updateTimeline(
    queryData
) {

    const timeline =
        document.querySelector(
            "#detailsModal .timeline"
        );


    if (!timeline) {

        return;

    }


    const aiProcessed =
        queryData.aiProcessed ===
        true;


    const aiResolved =
        queryData.aiAnswered ===
        true;


    const facultyResolved =
        queryData.status ===
        "resolved"
        &&
        !aiResolved;


    const resolved =
        queryData.status ===
            "resolved"
        ||
        aiResolved;


    timeline.innerHTML = `

        <div class="timeline-item completed">

            <span>✓</span>

            <div>

                <strong>
                    Query Submitted
                </strong>

                <small>
                    ${formatFullDate(
                        queryData.createdAt
                    )}
                </small>

            </div>

        </div>


        ${
            aiProcessed
                ? `
                    <div class="timeline-item completed">

                        <span>✓</span>

                        <div>

                            <strong>
                                AI Analysis Completed
                            </strong>

                            <small>
                                ${
                                    queryData.aiAnswered
                                        ? "AI answer generated"
                                        : "AI analysis completed"
                                }
                            </small>

                        </div>

                    </div>
                  `
                : `
                    <div class="timeline-item">

                        <span>○</span>

                        <div>

                            <strong>
                                AI Analysis
                            </strong>

                            <small>
                                Processing not completed
                            </small>

                        </div>

                    </div>
                  `
        }


        ${
            facultyResolved
                ? `
                    <div class="timeline-item completed">

                        <span>✓</span>

                        <div>

                            <strong>
                                Faculty Response
                            </strong>

                            <small>
                                ${
                                    queryData.facultyResponse &&
                                    queryData.facultyResponse.respondedAt
                                        ? formatFullDate(
                                            queryData.facultyResponse.respondedAt
                                        )
                                        : queryData.resolvedAt
                                            ? formatFullDate(
                                                queryData.resolvedAt
                                            )
                                            : "Response submitted"
                                }
                            </small>

                        </div>

                    </div>
                  `
                : ""
        }


        ${
            aiResolved
                ? `
                    <div class="timeline-item completed">

                        <span>✓</span>

                        <div>

                            <strong>
                                AI Resolved
                            </strong>

                            <small>
                                ${
                                    queryData.resolvedAt
                                        ? formatFullDate(
                                            queryData.resolvedAt
                                        )
                                        : "AI solution generated"
                                }
                            </small>

                        </div>

                    </div>
                  `
                : ""
        }


        ${
            !resolved
                ? `
                    <div class="timeline-item active">

                        <span>●</span>

                        <div>

                            <strong>
                                ${
                                    queryData.status ===
                                    "in-progress"
                                        ? "In Progress"
                                        : "Awaiting Faculty"
                                }
                            </strong>

                            <small>
                                ${
                                    queryData.status ===
                                    "in-progress"
                                        ? "Faculty is handling your query"
                                        : "Awaiting further processing"
                                }
                            </small>

                        </div>

                    </div>
                  `
                : ""
        }

    `;

}


/* =========================================
   AI SOLUTION MODAL
========================================= */

function openSolutionModal(
    queryData
) {

    const modal =
        document.getElementById(
            "solutionModal"
        );


    if (!modal) {

        console.warn(
            "solutionModal not found."
        );

        return;

    }


    const question =
        document.getElementById(
            "solutionQuestion"
        );


    const answer =
        document.getElementById(
            "solutionAnswer"
        );


    if (question) {

        question.textContent =
            queryData.title ||
            queryData.description ||
            "Your Query";

    }


    /*
     * AI answer fields supported:
     *
     * aiAnswer
     * solution
     */

    if (answer) {

        if (
            queryData.aiAnswer
        ) {

            answer.textContent =
                queryData.aiAnswer;

        } else if (
            queryData.solution
        ) {

            answer.textContent =
                queryData.solution;

        } else {

            answer.textContent =
                "An AI-generated solution is not available for this query yet.";

        }

    }


    /* =============================
       AI CONFIDENCE
    ============================= */

    const confidence =
        Number(
            queryData.aiConfidence ||
            0
        );


    const confidenceStrong =
        document.querySelector(
            ".confidence-box strong"
        );


    if (confidenceStrong) {

        confidenceStrong.textContent =
            `${confidence}%`;

    }


    const confidenceBar =
        document.querySelector(
            ".confidence-bar div"
        );


    if (confidenceBar) {

        confidenceBar.style.width =
            `${Math.min(
                confidence,
                100
            )}%`;

    }


    /* =============================
       SOURCE
    ============================= */

    const sourceStrong =
        document.querySelector(
            ".source-box strong"
        );


    if (sourceStrong) {

        sourceStrong.textContent =
            queryData.source ||
            "DeptConnect Knowledge Base";

    }


    modal.classList.add(
        "show"
    );

}


/* =========================================
   FACULTY RESPONSE MODAL
========================================= */

function openFacultyResponseModal(
    queryData
) {

    const modal =
        document.getElementById(
            "facultyResponseModal"
        );


    if (!modal) {

        console.error(
            "facultyResponseModal not found."
        );

        return;

    }


    const facultyResponse =
        queryData.facultyResponse;


    if (!facultyResponse) {

        console.error(
            "No faculty response found for query:",
            queryData.id
        );

        return;

    }


    /* =============================
       QUESTION
    ============================= */

    const question =
        document.getElementById(
            "facultyResponseQuestion"
        );


    if (question) {

        question.textContent =
            queryData.title ||
            queryData.description ||
            "Your Query";

    }


    /* =============================
       FACULTY NAME
    ============================= */

    const facultyName =
        document.getElementById(
            "facultyResponseName"
        );


    if (facultyName) {

        facultyName.textContent =
            facultyResponse.facultyName ||
            "Assigned Faculty";

    }


    /* =============================
       RESPONSE DATE
    ============================= */

    const responseDate =
        document.getElementById(
            "facultyResponseDate"
        );


    if (responseDate) {

        responseDate.textContent =
            facultyResponse.respondedAt
                ? formatFullDate(
                    facultyResponse.respondedAt
                )
                : "Date unavailable";

    }


    /* =============================
       RESPONSE TEXT
    ============================= */

    const responseText =
        document.getElementById(
            "facultyResponseText"
        );


    if (responseText) {

        responseText.textContent =
            facultyResponse.response ||
            "No response content available.";

    }


    /* =============================
       COURSE
    ============================= */

    const responseCourse =
        document.getElementById(
            "facultyResponseCourse"
        );


    if (responseCourse) {

        responseCourse.textContent =
            facultyResponse.course ||
            queryData.course ||
            "Not specified";

    }


    /* =============================
       STATUS
    ============================= */

    const responseStatus =
        document.getElementById(
            "facultyResponseStatus"
        );


    if (responseStatus) {

        responseStatus.textContent =
            facultyResponse.status
                ? capitalize(
                    facultyResponse.status
                )
                : "Resolved";

    }


    /* =============================
       OPEN MODAL
    ============================= */

    modal.classList.add(
        "show"
    );

}


/* =========================================
   CLOSE MODALS
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

                    const modalId =
                        button.dataset.close;


                    const modal =
                        document.getElementById(
                            modalId
                        );


                    if (modal) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }
    );


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
            event.key !==
            "Escape"
        ) {

            return;

        }


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
);


/* =========================================
   SEARCH
========================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


/* =========================================
   FILTERS
========================================= */

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (departmentFilter) {

    departmentFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (sortFilter) {

    sortFilter.addEventListener(
        "change",
        applyFilters
    );

}


/* =========================================
   CLEAR FILTERS
========================================= */

if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        () => {

            if (searchInput) {

                searchInput.value =
                    "";

            }


            if (statusFilter) {

                statusFilter.value =
                    "all";

            }


            if (departmentFilter) {

                departmentFilter.value =
                    "all";

            }


            if (dateFilter) {

                dateFilter.value =
                    "all";

            }


            if (sortFilter) {

                sortFilter.value =
                    "recent";

            }


            applyFilters();

        }
    );

}


/* =========================================
   DATE FILTER
========================================= */

function matchesDateFilter(
    timestamp,
    filter
) {

    const timestampValue =
        getTimestamp(
            timestamp
        );


    if (!timestampValue) {

        return false;

    }


    const now =
        Date.now();


    const difference =
        now -
        timestampValue;


    const day =
        24 *
        60 *
        60 *
        1000;


    switch (filter) {

        case "today":

            return (
                new Date(
                    timestampValue
                ).toDateString()
                ===
                new Date(
                    now
                ).toDateString()
            );


        case "week":

            return (
                difference <=
                7 * day
            );


        case "month":

            return (
                difference <=
                30 * day
            );


        default:

            return true;

    }

}


/* =========================================
   FIRESTORE TIMESTAMP
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

        return value.toDate()
            .getTime();

    }


    if (
        value.seconds !==
        undefined
    ) {

        return value.seconds *
            1000;

    }


    const date =
        new Date(value);


    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();

}


/* =========================================
   RELATIVE TIME
========================================= */

function formatRelativeTime(
    timestamp
) {

    const time =
        getTimestamp(
            timestamp
        );


    if (!time) {

        return "Unknown time";

    }


    const difference =
        Date.now() -
        time;


    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;


    if (
        difference <
        minute
    ) {

        return "Just now";

    }


    if (
        difference <
        hour
    ) {

        const minutes =
            Math.floor(
                difference /
                minute
            );


        return `${minutes} ${
            minutes === 1
                ? "minute"
                : "minutes"
        } ago`;

    }


    if (
        difference <
        day
    ) {

        const hours =
            Math.floor(
                difference /
                hour
            );


        return `${hours} ${
            hours === 1
                ? "hour"
                : "hours"
        } ago`;

    }


    const days =
        Math.floor(
            difference /
            day
        );


    if (
        days <
        30
    ) {

        return `${days} ${
            days === 1
                ? "day"
                : "days"
        } ago`;

    }


    return formatFullDate(
        timestamp
    );

}


/* =========================================
   FULL DATE
========================================= */

function formatFullDate(
    timestamp
) {

    const time =
        getTimestamp(
            timestamp
        );


    if (!time) {

        return "Not available";

    }


    return new Date(
        time
    ).toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================
   NORMALIZE VALUE
========================================= */

function normalizeValue(
    value
) {

    return String(
        value || ""
    )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            "-"
        );

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


    return String(value)
        .charAt(0)
        .toUpperCase()
        +
        String(value)
            .slice(1);

}


/* =========================================
   SHORT QUERY ID
========================================= */

function shortQueryId(
    id
) {

    if (!id) {

        return "000";

    }


    return id
        .slice(0, 6)
        .toUpperCase();

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHTML(
    value
) {

    return String(
        value || ""
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
   PROFILE MENU
========================================= */

const profileButton =
    document.getElementById(
        "profileButton"
    );

const profileMenu =
    document.getElementById(
        "profileMenu"
    );


if (
    profileButton &&
    profileMenu
) {

    profileButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            profileMenu.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        () => {

            profileMenu.classList.remove(
                "show"
            );

        }
    );


    profileMenu.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );

}


/* =========================================
   NOTIFICATIONS
========================================= */

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "notifications.html";

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                sessionStorage.clear();


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}