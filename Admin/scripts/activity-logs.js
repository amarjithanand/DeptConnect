import {
    collection,
    getDocs,
    query,
    where
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

let activities = [];

let filteredActivities = [];



/* =========================================
   DOM
========================================= */

const adminEmail =
    document.getElementById(
        "adminEmail"
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


const searchInput =
    document.getElementById(
        "searchInput"
    );


const typeFilter =
    document.getElementById(
        "typeFilter"
    );


const sourceFilter =
    document.getElementById(
        "sourceFilter"
    );


const dateFilter =
    document.getElementById(
        "dateFilter"
    );


const clearFilters =
    document.getElementById(
        "clearFilters"
    );



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


            const role =
                roleSnapshot.docs[0].data();


            if (
                role.role !==
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


            await loadActivities();

        }

        catch (error) {

            console.error(
                "Admin verification error:",
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
   LOAD ACTIVITIES
========================================= */

async function loadActivities() {

    try {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "Loading...";


        const [

            studentsSnapshot,

            facultySnapshot,

            queriesSnapshot,

            responsesSnapshot,

            notificationsSnapshot

        ] =
        await Promise.all([

            getDocs(
                collection(
                    db,
                    "students"
                )
            ),

            getDocs(
                collection(
                    db,
                    "faculty"
                )
            ),

            getDocs(
                collection(
                    db,
                    "queries"
                )
            ),

            getDocs(
                collection(
                    db,
                    "responses"
                )
            ),

            getDocs(
                collection(
                    db,
                    "student-notification"
                )
            )

        ]);


        activities = [];


        /*
         * STUDENT ACTIVITIES
         */

        studentsSnapshot.docs.forEach(
            document => {

                const data =
                    document.data();


                if (
                    data.createdAt
                ) {

                    activities.push({

                        id:
                            `student-${document.id}`,

                        type:
                            "user",

                        source:
                            "student",

                        title:
                            "Student Registered",

                        description:
                            `${data.name || "Student"} registered in ${
                                data.department || "the department"
                            }.`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${data.name || ""} ${
                                data.email || ""
                            } ${
                                data.studentId || ""
                            } ${
                                data.department || ""
                            }`

                    });

                }

            }
        );



        /*
         * FACULTY ACTIVITIES
         */

        facultySnapshot.docs.forEach(
            document => {

                const data =
                    document.data();


                if (
                    data.createdAt
                ) {

                    activities.push({

                        id:
                            `faculty-${document.id}`,

                        type:
                            "user",

                        source:
                            "faculty",

                        title:
                            "Faculty Registered",

                        description:
                            `${data.name || "Faculty"} registered as ${
                                data.designation || "faculty"
                            }.`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${data.name || ""} ${
                                data.email || ""
                            } ${
                                data.facultyId || ""
                            } ${
                                data.department || ""
                            }`

                    });

                }



                /*
                 * APPROVAL ACTIVITY
                 */

                if (
                    data.approvedAt
                ) {

                    activities.push({

                        id:
                            `faculty-approved-${document.id}`,

                        type:
                            "user",

                        source:
                            "system",

                        title:
                            "Faculty Approved",

                        description:
                            `${data.name || "Faculty"} was approved for system access.`,

                        timestamp:
                            data.approvedAt,

                        searchText:
                            `${data.name || ""} ${
                                data.email || ""
                            } approved`

                    });

                }



                /*
                 * REJECTION ACTIVITY
                 */

                if (
                    data.rejectedAt
                ) {

                    activities.push({

                        id:
                            `faculty-rejected-${document.id}`,

                        type:
                            "user",

                        source:
                            "system",

                        title:
                            "Faculty Rejected",

                        description:
                            `${data.name || "Faculty"} registration was rejected.`,

                        timestamp:
                            data.rejectedAt,

                        searchText:
                            `${data.name || ""} rejected`

                    });

                }

            }
        );



        /*
         * QUERY ACTIVITIES
         */

        queriesSnapshot.docs.forEach(
            document => {

                const data =
                    document.data();


                const queryTitle =
                    data.title ||
                    "Untitled Query";


                /*
                 * Query creation
                 */

                if (
                    data.createdAt
                ) {

                    activities.push({

                        id:
                            `query-created-${document.id}`,

                        type:
                            "query",

                        source:
                            "student",

                        title:
                            "Query Submitted",

                        description:
                            `"${queryTitle}" was submitted by student ${
                                data.studentId || "Unknown"
                            }.`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${queryTitle} ${
                                data.description || ""
                            } ${
                                data.department || ""
                            } ${
                                data.studentId || ""
                            }`

                    });

                }



                /*
                 * AI PROCESSING
                 */

                if (
                    data.aiProcessed ===
                    true
                ) {

                    activities.push({

                        id:
                            `ai-${document.id}`,

                        type:
                            "ai",

                        source:
                            "ai",

                        title:
                            "AI Processed Query",

                        description:
                            `AI processed "${queryTitle}" with confidence ${
                                formatScore(
                                    data.aiConfidence
                                )
                            }.`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${queryTitle} AI processed ${
                                data.aiEscalationReason || ""
                            }`

                    });

                }



                /*
                 * AI ANSWER
                 */

                if (
                    data.aiAnswered ===
                    true
                ) {

                    activities.push({

                        id:
                            `ai-answer-${document.id}`,

                        type:
                            "ai",

                        source:
                            "ai",

                        title:
                            "AI Answer Generated",

                        description:
                            `AI generated an answer for "${queryTitle}".`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${queryTitle} AI answered generated`

                    });

                }



                /*
                 * FACULTY ASSIGNMENT
                 */

                if (
                    data.assignedFacultyId
                ) {

                    activities.push({

                        id:
                            `assignment-${document.id}`,

                        type:
                            "query",

                        source:
                            "system",

                        title:
                            "Query Assigned",

                        description:
                            `"${queryTitle}" was assigned to faculty.`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${queryTitle} assigned faculty ${
                                data.assignedFacultyId
                            }`

                    });

                }

            }
        );



        /*
         * RESPONSE ACTIVITIES
         */

        responsesSnapshot.docs.forEach(
            document => {

                const data =
                    document.data();


                if (
                    data.respondedAt
                ) {

                    const aiGenerated =
                        data.aiGenerated ===
                        true;


                    activities.push({

                        id:
                            `response-${document.id}`,

                        type:
                            "response",

                        source:
                            aiGenerated
                                ? "ai"
                                : "faculty",

                        title:
                            aiGenerated
                                ? "AI Response Generated"
                                : "Faculty Response Submitted",

                        description:
                            aiGenerated

                                ? `AI generated a response for "${
                                    data.queryTitle ||
                                    "academic query"
                                }".`

                                : `${
                                    data.facultyName ||
                                    "Faculty"
                                } responded to "${
                                    data.queryTitle ||
                                    "academic query"
                                }.`,

                        timestamp:
                            data.respondedAt,

                        searchText:
                            `${data.queryTitle || ""} ${
                                data.facultyName || ""
                            } ${
                                data.response || ""
                            }`

                    });

                }

            }
        );



        /*
         * NOTIFICATIONS
         */

        notificationsSnapshot.docs.forEach(
            document => {

                const data =
                    document.data();


                if (
                    data.createdAt
                ) {

                    activities.push({

                        id:
                            `notification-${document.id}`,

                        type:
                            "notification",

                        source:
                            "faculty",

                        title:
                            "Notification Created",

                        description:
                            `${
                                data.title ||
                                "Academic notification"
                            } was created.`,

                        timestamp:
                            data.createdAt,

                        searchText:
                            `${data.title || ""} ${
                                data.description || ""
                            } ${
                                data.department || ""
                            }`

                    });

                }

            }
        );



        /*
         * SORT NEWEST FIRST
         */

        activities.sort(
            (a, b) =>
                getTimestamp(
                    b.timestamp
                )
                -
                getTimestamp(
                    a.timestamp
                )
        );


        filteredActivities =
            [
                ...activities
            ];


        updateStatistics();

        renderActivities();

    }

    catch (error) {

        console.error(
            "Activity loading error:",
            error
        );


        showToast(
            "Unable to load activity logs.",
            "error"
        );

    }

    finally {

        refreshButton.disabled =
            false;

        refreshButton.textContent =
            "Refresh";

    }

}



/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const todayStart =
        new Date();


    todayStart.setHours(
        0,
        0,
        0,
        0
    );


    const today =
        activities.filter(
            activity =>
                getTimestamp(
                    activity.timestamp
                ) >=
                todayStart.getTime()
        ).length;


    const queries =
        activities.filter(
            activity =>
                activity.type ===
                "query"
        ).length;


    const ai =
        activities.filter(
            activity =>
                activity.type ===
                "ai"
        ).length;


    const responses =
        activities.filter(
            activity =>
                activity.type ===
                "response"
        ).length;


    const users =
        activities.filter(
            activity =>
                activity.type ===
                "user"
        ).length;


    document.getElementById(
        "totalActivities"
    ).textContent =
        activities.length;


    document.getElementById(
        "todayActivities"
    ).textContent =
        today;


    document.getElementById(
        "queryActivities"
    ).textContent =
        queries;


    document.getElementById(
        "aiActivities"
    ).textContent =
        ai;


    document.getElementById(
        "responseActivities"
    ).textContent =
        responses;


    document.getElementById(
        "userActivities"
    ).textContent =
        users;

}



/* =========================================
   FILTERING
========================================= */

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const type =
        typeFilter.value;


    const source =
        sourceFilter.value;


    const date =
        dateFilter.value;


    const now =
        Date.now();


    filteredActivities =
        activities.filter(
            activity => {

                /*
                 * Search
                 */

                if (
                    search &&
                    !(
                        activity.title
                            .toLowerCase()
                            .includes(
                                search
                            )
                        ||
                        activity.description
                            .toLowerCase()
                            .includes(
                                search
                            )
                        ||
                        activity.searchText
                            .toLowerCase()
                            .includes(
                                search
                            )
                    )
                ) {

                    return false;

                }



                /*
                 * Type
                 */

                if (
                    type !==
                    "all" &&
                    activity.type !==
                    type
                ) {

                    return false;

                }



                /*
                 * Source
                 */

                if (
                    source !==
                    "all" &&
                    activity.source !==
                    source
                ) {

                    return false;

                }



                /*
                 * Date
                 */

                const timestamp =
                    getTimestamp(
                        activity.timestamp
                    );


                if (
                    date ===
                    "today"
                ) {

                    const start =
                        new Date();


                    start.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    if (
                        timestamp <
                        start.getTime()
                    ) {

                        return false;

                    }

                }


                if (
                    date ===
                    "7days"
                ) {

                    if (
                        timestamp <
                        now -
                        7 *
                        24 *
                        60 *
                        60 *
                        1000
                    ) {

                        return false;

                    }

                }


                if (
                    date ===
                    "30days"
                ) {

                    if (
                        timestamp <
                        now -
                        30 *
                        24 *
                        60 *
                        60 *
                        1000
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderActivities();

}



/* =========================================
   RENDER
========================================= */

function renderActivities() {

    renderTimeline();

    renderTable();


    document.getElementById(
        "activityCount"
    ).textContent =
        `${
            filteredActivities.length
        } ${
            filteredActivities.length === 1
                ? "activity"
                : "activities"
        }`;

}



/* =========================================
   TIMELINE
========================================= */

function renderTimeline() {

    const container =
        document.getElementById(
            "activityTimeline"
        );


    container.innerHTML =
        "";


    const latest =
        filteredActivities.slice(
            0,
            15
        );


    if (
        latest.length ===
        0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    —
                </div>

                <strong>
                    No activities found
                </strong>

                <p>
                    Try changing your filters.
                </p>

            </div>

        `;

        return;

    }


    latest.forEach(
        activity => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "timeline-item";


            item.innerHTML = `

                <div
                    class="timeline-icon ${getActivityClass(
                        activity
                    )}"
                >

                    ${getActivityIcon(
                        activity
                    )}

                </div>


                <div class="timeline-content">

                    <div class="timeline-top">

                        <strong>
                            ${escapeHTML(
                                activity.title
                            )}
                        </strong>

                        <span>
                            ${formatRelativeTime(
                                activity.timestamp
                            )}
                        </span>

                    </div>


                    <p>
                        ${escapeHTML(
                            activity.description
                        )}
                    </p>


                    <div class="timeline-tags">

                        <span>
                            ${capitalize(
                                activity.type
                            )}
                        </span>

                        <span>
                            ${capitalize(
                                activity.source
                            )}
                        </span>

                    </div>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}



/* =========================================
   TABLE
========================================= */

function renderTable() {

    const table =
        document.getElementById(
            "activityTable"
        );


    table.innerHTML =
        "";


    const latest =
        filteredActivities.slice(
            0,
            50
        );


    if (
        latest.length ===
        0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-table"
                >
                    No activity records found.
                </td>

            </tr>

        `;

        return;

    }


    latest.forEach(
        activity => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <div class="activity-name">

                        <span
                            class="mini-icon ${getActivityClass(
                                activity
                            )}"
                        >
                            ${getActivityIcon(
                                activity
                            )}
                        </span>

                        <strong>
                            ${escapeHTML(
                                activity.title
                            )}
                        </strong>

                    </div>

                </td>


                <td>

                    <span class="type-badge ${getActivityClass(
                        activity
                    )}">

                        ${capitalize(
                            activity.type
                        )}

                    </span>

                </td>


                <td>
                    ${capitalize(
                        activity.source
                    )}
                </td>


                <td class="description-cell">

                    ${escapeHTML(
                        activity.description
                    )}

                </td>


                <td>
                    ${formatDateTime(
                        activity.timestamp
                    )}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}



/* =========================================
   ACTIVITY ICON
========================================= */

function getActivityIcon(
    activity
) {

    if (
        activity.type ===
        "ai"
    ) {

        return "AI";

    }


    if (
        activity.type ===
        "query"
    ) {

        return "?";

    }


    if (
        activity.type ===
        "response"
    ) {

        return "R";

    }


    if (
        activity.type ===
        "notification"
    ) {

        return "N";

    }


    return "U";

}



/* =========================================
   ACTIVITY CLASS
========================================= */

function getActivityClass(
    activity
) {

    return activity.type;

}



/* =========================================
   SCORE
========================================= */

function formatScore(
    value
) {

    if (
        value ===
        undefined ||
        value ===
        null
    ) {

        return "N/A";

    }


    let score =
        Number(
            value
        );


    if (
        isNaN(score)
    ) {

        return "N/A";

    }


    if (
        score <=
        1
    ) {

        score *=
            100;

    }


    return `${score.toFixed(1)}%`;

}



/* =========================================
   TIMESTAMP
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

        return "Unknown";

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


    return formatDateTime(
        value
    );

}



/* =========================================
   DATE TIME
========================================= */

function formatDateTime(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {

        return "Unknown";

    }


    return new Date(
        timestamp
    ).toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
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


    return value
        .charAt(0)
        .toUpperCase()
        +
        value
            .slice(1);

}



/* =========================================
   ESCAPE HTML
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
   FILTER EVENTS
========================================= */

searchInput.addEventListener(
    "input",
    applyFilters
);


typeFilter.addEventListener(
    "change",
    applyFilters
);


sourceFilter.addEventListener(
    "change",
    applyFilters
);


dateFilter.addEventListener(
    "change",
    applyFilters
);



/* =========================================
   CLEAR FILTERS
========================================= */

clearFilters.addEventListener(
    "click",
    () => {

        searchInput.value =
            "";

        typeFilter.value =
            "all";

        sourceFilter.value =
            "all";

        dateFilter.value =
            "all";

        applyFilters();

    }
);



/* =========================================
   REFRESH
========================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        await loadActivities();

        showToast(
            "Activity logs refreshed.",
            "success"
        );

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