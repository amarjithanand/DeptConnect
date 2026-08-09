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
    getDocs,
    doc,
    setDoc,
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
   INITIALIZE
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

let currentUser = null;

let currentStudent = null;

let allNotifications = [];

let currentFilter = "all";


/* =========================================
   DOM
========================================= */

const notificationList =
    document.getElementById(
        "notificationList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const unreadCount =
    document.getElementById(
        "unreadCount"
    );

const totalCount =
    document.getElementById(
        "totalCount"
    );

const departmentCount =
    document.getElementById(
        "departmentCount"
    );

const allCount =
    document.getElementById(
        "allCount"
    );

const filterUnreadCount =
    document.getElementById(
        "filterUnreadCount"
    );

const markAllButton =
    document.getElementById(
        "markAllButton"
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

const navNotificationDot =
    document.getElementById(
        "navNotificationDot"
    );


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.log(
                "No authenticated user."
            );


            window.location.href =
                "login.html";


            return;

        }


        currentUser =
            user;


        console.log(
            "Authenticated UID:",
            user.uid
        );


        try {

            await loadStudentProfile(
                user.uid
            );


            await loadNotifications(
                user.uid
            );


        } catch (error) {

            console.error(
                "Notification loading error:",
                error
            );


            showEmptyState(
                "Unable to load notifications."
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


    /*
     * IMPORTANT:
     *
     * This assumes:
     *
     * students/{uid}
     *
     * If your student document ID is still
     * Lm7qqvd9DwpuJIMrgtK6 while uid is
     * kD6junBAg7dityG9Hdyz3YlYexW2,
     * this query version is used instead.
     */


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

        throw new Error(
            "Student profile not found."
        );

    }


    const studentDocument =
        snapshot.docs[0];


    currentStudent = {

        id:
            studentDocument.id,

        ...studentDocument.data()

    };


    console.log(
        "Current student:",
        currentStudent
    );


    updateStudentProfileUI(
        currentStudent
    );

}


/* =========================================
   UPDATE PROFILE UI
========================================= */

function updateStudentProfileUI(
    student
) {

    const name =
        student.name ||
        "Student";


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (
        avatar &&
        student.profileImg
    ) {

        avatar.innerHTML = `

            <img
                src="${escapeAttribute(
                    student.profileImg
                )}"
                alt="${escapeAttribute(
                    name
                )}"
                class="notification-profile-image"
            >

        `;

    } else if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================
   LOAD NOTIFICATIONS
========================================= */

async function loadNotifications(
    uid
) {

    console.log(
        "Loading applicable notifications..."
    );


    if (
        !currentStudent
    ) {

        throw new Error(
            "Student profile is unavailable."
        );

    }


    const department =
        currentStudent.department;


    console.log(
        "Student department:",
        department
    );


    if (!department) {

        throw new Error(
            "Student department is missing."
        );

    }


    /*
     * We intentionally perform TWO queries.
     *
     * Query 1:
     * targetType == all
     *
     * Query 2:
     * targetType == department
     * AND department == student's department
     *
     * This means notifications belonging to
     * another department are never requested.
     */


    const allQuery =
        query(
            collection(
                db,
                "student-notification"
            ),
            where(
                "targetType",
                "==",
                "all"
            )
        );


    const departmentQuery =
        query(
            collection(
                db,
                "student-notification"
            ),
            where(
                "targetType",
                "==",
                "department"
            ),
            where(
                "department",
                "==",
                department
            )
        );


    const [
        allSnapshot,
        departmentSnapshot
    ] = await Promise.all([

        getDocs(
            allQuery
        ),

        getDocs(
            departmentQuery
        )

    ]);


    console.log(
        "All-student notifications:",
        allSnapshot.size
    );


    console.log(
        "Department notifications:",
        departmentSnapshot.size
    );


    const notificationMap =
        new Map();


    /* =====================================
       ALL STUDENT NOTIFICATIONS
    ====================================== */

    allSnapshot.forEach(
        document => {

            notificationMap.set(
                document.id,
                {

                    id:
                        document.id,

                    ...document.data(),

                    target:
                        "all"

                }
            );

        }
    );


    /* =====================================
       DEPARTMENT NOTIFICATIONS
    ====================================== */

    departmentSnapshot.forEach(
        document => {

            notificationMap.set(
                document.id,
                {

                    id:
                        document.id,

                    ...document.data(),

                    target:
                        "department"

                }
            );

        }
    );


    /*
     * Convert Map → Array
     */

    allNotifications =
        Array.from(
            notificationMap.values()
        );


    /*
     * Newest first.
     */

    allNotifications.sort(
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


    /*
     * Load read state for current student.
     */

    await loadReadStates(
        uid
    );


    updateStatistics();


    applyFilter();

}


/* =========================================
   READ STATE
========================================= */

async function loadReadStates(
    uid
) {

    /*
     * We store per-student read state in:
     *
     * student-notification-status
     *
     * Document ID:
     *
     * uid_notificationId
     */

    for (
        const notification
        of allNotifications
    ) {

        const statusId =
            createStatusId(
                uid,
                notification.id
            );


        try {

            const statusQuery =
                query(
                    collection(
                        db,
                        "student-notification-status"
                    ),
                    where(
                        "uid",
                        "==",
                        uid
                    ),
                    where(
                        "notificationId",
                        "==",
                        notification.id
                    )
                );


            const snapshot =
                await getDocs(
                    statusQuery
                );


            notification.read =
                !snapshot.empty &&
                snapshot.docs[0]
                    .data()
                    .read === true;


        } catch (error) {

            console.error(
                "Read state error:",
                error
            );


            notification.read =
                false;

        }

    }

}


/* =========================================
   UPDATE STATISTICS
========================================= */

function updateStatistics() {

    const total =
        allNotifications.length;


    const unread =
        allNotifications.filter(
            notification =>
                notification.read !== true
        ).length;


    const department =
        allNotifications.filter(
            notification =>
                notification.targetType ===
                "department"
        ).length;


    if (totalCount) {

        totalCount.textContent =
            total;

    }


    if (allCount) {

        allCount.textContent =
            total;

    }


    if (unreadCount) {

        unreadCount.textContent =
            unread;

    }


    if (filterUnreadCount) {

        filterUnreadCount.textContent =
            unread;

    }


    if (departmentCount) {

        departmentCount.textContent =
            department;

    }


    /*
     * Notification dot
     */

    if (navNotificationDot) {

        navNotificationDot.style.display =
            unread > 0
                ? "block"
                : "none";

    }

}


/* =========================================
   FILTER BUTTONS
========================================= */

document
    .querySelectorAll(
        ".filter-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter ||
                        "all";


                    applyFilter();

                }
            );

        }
    );


/* =========================================
   APPLY FILTER
========================================= */

function applyFilter() {

    let filtered =
        [...allNotifications];


    switch (
        currentFilter
    ) {

        case "unread":

            filtered =
                filtered.filter(
                    notification =>
                        notification.read !==
                        true
                );

            break;


        case "all-students":

            filtered =
                filtered.filter(
                    notification =>
                        notification.targetType ===
                        "all"
                );

            break;


        case "department":

            filtered =
                filtered.filter(
                    notification =>
                        notification.targetType ===
                        "department"
                );

            break;


        case "all":

        default:

            break;

    }


    renderNotifications(
        filtered
    );

}


/* =========================================
   RENDER NOTIFICATIONS
========================================= */

function renderNotifications(
    notifications
) {

    notificationList.innerHTML =
        "";


    if (
        notifications.length ===
        0
    ) {

        showEmptyState();

        return;

    }


    emptyState.style.display =
        "none";


    notifications.forEach(
        notification => {

            const card =
                createNotificationCard(
                    notification
                );


            notificationList.appendChild(
                card
            );

        }
    );

}


/* =========================================
   CREATE NOTIFICATION CARD
========================================= */

function createNotificationCard(
    notification
) {

    const article =
        document.createElement(
            "article"
        );


    const isUnread =
        notification.read !== true;


    article.className =
        isUnread
            ? "notification-card unread"
            : "notification-card";


    article.dataset.id =
        notification.id;


    article.dataset.read =
        String(
            !isUnread
        );


    const targetType =
        notification.targetType;


    const targetLabel =
        targetType ===
            "department"

            ? `${notification.department || "Department"}`
            : "All Students";


    const targetClass =
        targetType ===
            "department"

            ? "faculty-icon"
            : "system-icon";


    const icon =
        targetType ===
            "department"

            ? "🏫"
            : "📢";


    const facultyName =
        notification.facultyName ||
        "Faculty";


    const time =
        formatRelativeTime(
            notification.createdAt
        );


    article.innerHTML = `

        <div
            class="notification-icon ${targetClass}"
        >
            ${icon}
        </div>


        <div class="notification-content">

            <div class="notification-top">

                <h3>
                    ${escapeHTML(
                        notification.title ||
                        "Announcement"
                    )}
                </h3>


                <span class="notification-time">

                    ${escapeHTML(
                        time
                    )}

                </span>

            </div>


            <p>

                ${escapeHTML(
                    notification.description ||
                    "No description available."
                )}

            </p>


            <div class="notification-meta">

                <span>
                    By
                    <strong>
                        ${escapeHTML(
                            facultyName
                        )}
                    </strong>
                </span>


                <span>
                    •
                </span>


                <span>

                    ${
                        targetType ===
                        "department"

                            ? `For ${escapeHTML(
                                targetLabel
                            )} Students`

                            : "For All Students"
                    }

                </span>

            </div>


            <div class="notification-actions">

                ${
                    isUnread

                        ? `
                            <button
                                class="read-button"
                                data-action="read"
                                type="button"
                            >
                                Mark as read
                            </button>
                          `

                        : `
                            <span class="read-label">
                                ✓ Read
                            </span>
                          `
                }

            </div>

        </div>


        ${
            isUnread
                ? `
                    <span class="unread-dot"></span>
                  `
                : ""
        }

    `;


    /* =====================================
       MARK AS READ
    ====================================== */

    const readButton =
        article.querySelector(
            '[data-action="read"]'
        );


    if (readButton) {

        readButton.addEventListener(
            "click",
            async event => {

                event.stopPropagation();


                await markAsRead(
                    notification.id
                );

            }
        );

    }


    return article;

}


/* =========================================
   MARK ONE AS READ
========================================= */

async function markAsRead(
    notificationId
) {

    if (!currentUser) {

        return;

    }


    try {

        const statusId =
            createStatusId(
                currentUser.uid,
                notificationId
            );


        await setDoc(
            doc(
                db,
                "student-notification-status",
                statusId
            ),
            {

                uid:
                    currentUser.uid,

                notificationId:
                    notificationId,

                read:
                    true,

                readAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        /*
         * Update local state immediately.
         */

        const notification =
            allNotifications.find(
                item =>
                    item.id ===
                    notificationId
            );


        if (notification) {

            notification.read =
                true;

        }


        updateStatistics();


        applyFilter();


    } catch (error) {

        console.error(
            "Error marking notification as read:",
            error
        );

    }

}


/* =========================================
   MARK ALL AS READ
========================================= */

if (markAllButton) {

    markAllButton.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                return;

            }


            markAllButton.disabled =
                true;


            markAllButton.textContent =
                "Marking...";


            try {

                for (
                    const notification
                    of allNotifications
                ) {

                    if (
                        notification.read ===
                        true
                    ) {

                        continue;

                    }


                    const statusId =
                        createStatusId(
                            currentUser.uid,
                            notification.id
                        );


                    await setDoc(
                        doc(
                            db,
                            "student-notification-status",
                            statusId
                        ),
                        {

                            uid:
                                currentUser.uid,

                            notificationId:
                                notification.id,

                            read:
                                true,

                            readAt:
                                serverTimestamp()

                        },
                        {
                            merge: true
                        }
                    );


                    notification.read =
                        true;

                }


                updateStatistics();


                applyFilter();


            } catch (error) {

                console.error(
                    "Mark all as read error:",
                    error
                );

            } finally {

                markAllButton.disabled =
                    false;


                markAllButton.textContent =
                    "✓ Mark all as read";

            }

        }
    );

}


/* =========================================
   STATUS DOCUMENT ID
========================================= */

function createStatusId(
    uid,
    notificationId
) {

    /*
     * Firebase document IDs cannot contain "/".
     */

    return `${uid}_${notificationId}`
        .replace(
            /[/]/g,
            "_"
        );

}


/* =========================================
   EMPTY STATE
========================================= */

function showEmptyState(
    message = null
) {

    notificationList.innerHTML =
        "";


    emptyState.style.display =
        "block";


    if (message) {

        const paragraph =
            emptyState.querySelector(
                "p"
            );


        if (paragraph) {

            paragraph.textContent =
                message;

        }

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
        days === 1
    ) {

        return "Yesterday";

    }


    if (
        days <
        7
    ) {

        return `${days} days ago`;

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

            /*
             * Already on notifications page.
             * Just ensure current filter is all.
             */

            currentFilter =
                "all";


            document
                .querySelectorAll(
                    ".filter-button"
                )
                .forEach(
                    button => {

                        button.classList.toggle(
                            "active",
                            button.dataset.filter ===
                            "all"
                        );

                    }
                );


            applyFilter();

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