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

const app =
    initializeApp(
        firebaseConfig
    );

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================
   GLOBAL DATA
========================================= */

let currentStudent = null;

let studentQueries = [];


/* =========================================
   DOM ELEMENTS
========================================= */

const studentName =
    document.getElementById(
        "studentName"
    );

const menuStudentName =
    document.getElementById(
        "menuStudentName"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileMenuAvatar =
    document.getElementById(
        "profileMenuAvatar"
    );

const totalQueries =
    document.getElementById(
        "totalQueries"
    );

const pendingQueries =
    document.getElementById(
        "pendingQueries"
    );

const aiResolvedQueries =
    document.getElementById(
        "aiResolvedQueries"
    );

const recentQueryList =
    document.getElementById(
        "recentQueryList"
    );

const recentQueriesEmpty =
    document.getElementById(
        "recentQueriesEmpty"
    );

const knowledgeSearch =
    document.getElementById(
        "knowledgeSearch"
    );

const profileButton =
    document.getElementById(
        "profileButton"
    );

const profileMenu =
    document.getElementById(
        "profileMenu"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


/* =========================================
   AUTH STATE
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


        try {

            await loadStudentProfile(
                user.uid
            );


            await loadStudentQueries(
                user.uid
            );


        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );

        }

    }
);


/* =========================================
   LOAD STUDENT PROFILE
========================================= */

async function loadStudentProfile(
    uid
) {

    console.log(
        "Loading student profile..."
    );


    const studentQuery =
        query(
            collection(
                db,
                "students"
            ),
            where(
                "uid",
                "==",
                uid
            )
        );


    const snapshot =
        await getDocs(
            studentQuery
        );


    console.log(
        "Student documents found:",
        snapshot.size
    );


    if (
        snapshot.empty
    ) {

        console.error(
            "Student profile not found."
        );

        return;

    }


    /*
     * Your students collection:
     *
     * students/{documentId}
     *
     * uid = Firebase Auth UID
     */

    const document =
        snapshot.docs[0];


    currentStudent = {

        id:
            document.id,

        ...document.data()

    };


    console.log(
        "Current student:",
        currentStudent
    );


    updateStudentUI(
        currentStudent
    );

}


/* =========================================
   UPDATE STUDENT UI
========================================= */

function updateStudentUI(
    student
) {

    const name =
        student.name ||
        "Student";


    /* =============================
       MAIN GREETING
    ============================= */

    if (studentName) {

        studentName.textContent =
            getFirstName(
                name
            );

    }


    /* =============================
       PROFILE MENU NAME
    ============================= */

    if (menuStudentName) {

        menuStudentName.textContent =
            name;

    }


    /* =============================
       PROFILE AVATAR
    ============================= */

    const image =
        student.profileImg ||
        "";


    if (
        image &&
        profileAvatar
    ) {

        profileAvatar.innerHTML = `
            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(name)}"
                class="dashboard-profile-image"
            >
        `;

    } else {

        setInitialAvatar(
            profileAvatar,
            name
        );

    }


    if (
        image &&
        profileMenuAvatar
    ) {

        profileMenuAvatar.innerHTML = `
            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(name)}"
                class="dashboard-profile-image"
            >
        `;

    } else {

        setInitialAvatar(
            profileMenuAvatar,
            name
        );

    }

}


/* =========================================
   LOAD STUDENT QUERIES
========================================= */

async function loadStudentQueries(
    uid
) {

    console.log(
        "Loading student queries..."
    );


    const queriesQuery =
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
            queriesQuery
        );


    console.log(
        "Student queries found:",
        snapshot.size
    );


    studentQueries = [];


    snapshot.forEach(
        document => {

            studentQueries.push({

                id:
                    document.id,

                ...document.data()

            });

        }
    );


    /*
     * Newest queries first.
     */

    studentQueries.sort(
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


    updateDashboardStatistics();


    renderRecentQueries(
        studentQueries.slice(
            0,
            3
        )
    );

}


/* =========================================
   UPDATE DASHBOARD STATISTICS
========================================= */

function updateDashboardStatistics() {

    const total =
        studentQueries.length;


    /*
     * Pending means status is pending.
     */

    const pending =
        studentQueries.filter(
            queryData =>
                queryData.status ===
                "pending"
        ).length;


    /*
     * AI resolved means:
     *
     * aiAnswered === true
     */

    const aiResolved =
        studentQueries.filter(
            queryData =>
                queryData.aiAnswered ===
                true
        ).length;


    if (totalQueries) {

        totalQueries.textContent =
            total;

    }


    if (pendingQueries) {

        pendingQueries.textContent =
            pending;

    }


    if (aiResolvedQueries) {

        aiResolvedQueries.textContent =
            aiResolved;

    }


    console.log(
        "Dashboard statistics:",
        {
            total,
            pending,
            aiResolved
        }
    );

}


/* =========================================
   RENDER RECENT QUERIES
========================================= */

function renderRecentQueries(
    queries
) {

    if (!recentQueryList) {

        return;

    }


    recentQueryList.innerHTML =
        "";


    if (
        queries.length ===
        0
    ) {

        if (recentQueriesEmpty) {

            recentQueriesEmpty.style.display =
                "block";

        }

        return;

    }


    if (recentQueriesEmpty) {

        recentQueriesEmpty.style.display =
            "none";

    }


    queries.forEach(
        queryData => {

            const element =
                createRecentQuery(
                    queryData
                );


            recentQueryList.appendChild(
                element
            );

        }
    );

}


/* =========================================
   CREATE RECENT QUERY
========================================= */

function createRecentQuery(
    queryData
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "query-item";


    /*
     * AI answered gets priority.
     */

    const status =
        getQueryStatus(
            queryData
        );


    const course =
        queryData.course ||
        queryData.department ||
        "Academic";


    const relativeTime =
        formatRelativeTime(
            queryData.createdAt
        );


    /*
     * Right-side text.
     */

    let rightText =
        "Awaiting response";


    if (
        queryData.aiAnswered ===
        true
    ) {

        rightText =
            "Instant";

    } else if (
        queryData.status ===
        "resolved"
    ) {

        rightText =
            "Resolved";

    } else if (
        queryData.status ===
        "in-progress"
    ) {

        rightText =
            "In Progress";

    }


    article.innerHTML = `

        <div class="query-main">

            <div class="query-meta">

                <span
                    class="status ${status.className}"
                >
                    ${status.label}
                </span>

                <span>
                    ${escapeHTML(
                        course
                    )}
                    ·
                    ${escapeHTML(
                        relativeTime
                    )}
                </span>

            </div>


            <h3>
                ${escapeHTML(
                    queryData.title ||
                    "Untitled Query"
                )}
            </h3>

        </div>


        <div class="query-right">

            <span>
                ${escapeHTML(
                    rightText
                )}
            </span>


            <span class="arrow">
                ›
            </span>

        </div>

    `;


    /*
     * Clicking a recent query
     * opens My Queries.
     */

    article.addEventListener(
        "click",
        () => {

            window.location.href =
                "my-queries.html";

        }
    );


    return article;

}


/* =========================================
   QUERY STATUS
========================================= */

function getQueryStatus(
    queryData
) {

    /*
     * AI resolution
     */

    if (
        queryData.aiAnswered ===
        true
    ) {

        return {

            label:
                "✨ AI RESOLVED",

            className:
                "resolved-status"

        };

    }


    /*
     * Faculty resolved
     */

    if (
        queryData.status ===
        "resolved"
    ) {

        return {

            label:
                "RESOLVED",

            className:
                "resolved-status"

        };

    }


    /*
     * In progress
     */

    if (
        queryData.status ===
        "in-progress"
    ) {

        return {

            label:
                "IN PROGRESS",

            className:
                "assigned"

        };

    }


    /*
     * Pending
     */

    if (
        queryData.status ===
        "pending"
    ) {

        return {

            label:
                "AWAITING FACULTY",

            className:
                "awaiting"

        };

    }


    /*
     * Default
     */

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


/* =========================================
   QUICK KNOWLEDGE SEARCH
========================================= */

if (knowledgeSearch) {

    knowledgeSearch.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Enter"
            ) {

                return;

            }


            const search =
                knowledgeSearch.value
                    .trim();


            if (!search) {

                return;

            }


            /*
             * Send search term to
             * Knowledge Base page.
             */

            window.location.href =
                `knowledge-base.html?search=${encodeURIComponent(
                    search
                )}`;

        }
    );

}


/* =========================================
   PROFILE MENU
========================================= */

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
   NOTIFICATION BUTTON
========================================= */

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


/* =========================================
   GET FIRST NAME
========================================= */

function getFirstName(
    name
) {

    if (!name) {

        return "Student";

    }


    return String(
        name
    )
        .trim()
        .split(
            /\s+/
        )[0];

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
        new Date(
            value
        );


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


    return new Date(
        time
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   AVATAR
========================================= */

function setInitialAvatar(
    element,
    name
) {

    if (!element) {

        return;

    }


    element.textContent =
        getFirstName(
            name
        )
            .charAt(0)
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
   ATTRIBUTE ESCAPE
========================================= */

function escapeAttribute(
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
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}