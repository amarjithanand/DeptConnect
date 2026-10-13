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

let allQueries = [];

let allResponses = [];

let processingChart = null;

let resolutionChart = null;

let confidenceChart = null;

let escalationChart = null;



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
                roleSnapshot.docs[0].data();


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


            await loadMonitoringData();

        }

        catch (error) {

            console.error(
                "Admin authentication error:",
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
   LOAD ALL MONITORING DATA
========================================= */

async function loadMonitoringData() {

    try {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "Loading...";


        const [
            queriesSnapshot,
            responsesSnapshot
        ] =
        await Promise.all([

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
            )

        ]);


        allQueries =
            queriesSnapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        allResponses =
            responsesSnapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        updateHealth();

        updateStatistics();

        updateQualityMetrics();

        renderProcessingChart();

        renderResolutionChart();

        renderConfidenceChart();

        renderEscalationChart();

        renderRecentActivity();

        renderLowConfidenceQueries();

    }

    catch (error) {

        console.error(
            "AI monitoring error:",
            error
        );


        showToast(
            "Unable to load AI monitoring data.",
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
   AI HEALTH
========================================= */

function updateHealth() {

    const processedQueries =
        allQueries.filter(
            queryData =>
                queryData.aiProcessed ===
                true
        );


    const recentLimit =
        Date.now() -
        (
            24 *
            60 *
            60 *
            1000
        );


    const recentAIQueries =
        processedQueries.filter(
            queryData =>
                getTimestamp(
                    queryData.createdAt
                ) >=
                recentLimit
        );


    const healthIndicator =
        document.getElementById(
            "healthIndicator"
        );


    const healthTitle =
        document.getElementById(
            "healthTitle"
        );


    const healthDescription =
        document.getElementById(
            "healthDescription"
        );


    healthIndicator.className =
        "health-indicator";


    if (
        recentAIQueries.length >
        0
    ) {

        healthIndicator.classList.add(
            "online"
        );


        healthTitle.textContent =
            "AI Activity Detected";


        healthDescription.textContent =
            `${recentAIQueries.length} AI-processed ${
                recentAIQueries.length === 1
                    ? "query"
                    : "queries"
            } detected in the last 24 hours.`;

    }

    else if (
        processedQueries.length >
        0
    ) {

        healthIndicator.classList.add(
            "idle"
        );


        healthTitle.textContent =
            "AI Currently Idle";


        healthDescription.textContent =
            "AI has processed queries previously, but no recent activity was detected.";

    }

    else {

        healthIndicator.classList.add(
            "offline"
        );


        healthTitle.textContent =
            "No AI Activity Detected";


        healthDescription.textContent =
            "No query currently contains aiProcessed = true.";

    }


    setComponentStatus(
        "firestoreStatusDot",
        "firestoreStatus",
        true,
        "Connected"
    );


    setComponentStatus(
        "semanticStatusDot",
        "semanticStatus",
        processedQueries.length > 0,
        processedQueries.length > 0
            ? "Processing detected"
            : "No activity"
    );


    const aiResponses =
        allResponses.filter(
            response =>
                response.aiGenerated ===
                true
        );


    setComponentStatus(
        "responseStatusDot",
        "responseStatus",
        aiResponses.length > 0,
        aiResponses.length > 0
            ? "Responses detected"
            : "No AI responses"
    );

}



/* =========================================
   COMPONENT STATUS
========================================= */

function setComponentStatus(
    dotId,
    textId,
    healthy,
    text
) {

    const dot =
        document.getElementById(
            dotId
        );


    const element =
        document.getElementById(
            textId
        );


    dot.className =
        `component-dot ${
            healthy
                ? "online"
                : "offline"
        }`;


    element.textContent =
        text;

}



/* =========================================
   MAIN STATISTICS
========================================= */

function updateStatistics() {

    const total =
        allQueries.length;


    const processed =
        allQueries.filter(
            item =>
                item.aiProcessed ===
                true
        ).length;


    const answered =
        allQueries.filter(
            item =>
                item.aiAnswered ===
                true
        ).length;


    const escalated =
        allQueries.filter(
            item =>
                item.aiProcessed ===
                    true &&
                item.aiAnswered !==
                    true
        ).length;


    const resolutionRate =
        processed > 0
            ? (
                answered /
                processed
            ) * 100
            : 0;


    const escalationRate =
        processed > 0
            ? (
                escalated /
                processed
            ) * 100
            : 0;


    document.getElementById(
        "totalQueries"
    ).textContent =
        total;


    document.getElementById(
        "aiProcessed"
    ).textContent =
        processed;


    document.getElementById(
        "aiAnswered"
    ).textContent =
        answered;


    document.getElementById(
        "aiEscalated"
    ).textContent =
        escalated;


    document.getElementById(
        "resolutionRate"
    ).textContent =
        `${resolutionRate.toFixed(1)}%`;


    document.getElementById(
        "escalationRate"
    ).textContent =
        `${escalationRate.toFixed(1)}%`;

}



/* =========================================
   QUALITY METRICS
========================================= */

function updateQualityMetrics() {

    const confidenceValues =
        allQueries
            .filter(
                item =>
                    item.aiProcessed ===
                        true &&
                    item.aiConfidence !==
                        undefined &&
                    item.aiConfidence !==
                        null
            )
            .map(
                item =>
                    normalizeScore(
                        item.aiConfidence
                    )
            );


    const averageConfidence =
        average(
            confidenceValues
        );


    const highConfidence =
        confidenceValues.filter(
            value =>
                value >= 80
        ).length;


    const lowConfidence =
        confidenceValues.filter(
            value =>
                value < 60
        ).length;


    const similarityValues =
        allResponses
            .filter(
                response =>
                    response.similarityScore !==
                        undefined &&
                    response.similarityScore !==
                        null
            )
            .map(
                response =>
                    normalizeScore(
                        response.similarityScore
                    )
            );


    const averageSimilarity =
        average(
            similarityValues
        );


    document.getElementById(
        "averageConfidence"
    ).textContent =
        `${averageConfidence.toFixed(1)}%`;


    document.getElementById(
        "confidenceProgress"
    ).style.width =
        `${Math.min(
            averageConfidence,
            100
        )}%`;


    document.getElementById(
        "averageSimilarity"
    ).textContent =
        `${averageSimilarity.toFixed(1)}%`;


    document.getElementById(
        "similarityProgress"
    ).style.width =
        `${Math.min(
            averageSimilarity,
            100
        )}%`;


    document.getElementById(
        "highConfidence"
    ).textContent =
        highConfidence;


    document.getElementById(
        "lowConfidence"
    ).textContent =
        lowConfidence;

}



/* =========================================
   PROCESSING TREND
========================================= */

function renderProcessingChart() {

    const canvas =
        document.getElementById(
            "processingChart"
        );


    const days = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();


        date.setHours(
            0,
            0,
            0,
            0
        );


        date.setDate(
            date.getDate() -
            i
        );


        days.push(
            date
        );

    }


    const labels =
        days.map(
            date =>
                date.toLocaleDateString(
                    "en-IN",
                    {
                        day:
                            "2-digit",

                        month:
                            "short"
                    }
                )
        );


    const processedData =
        days.map(
            date =>
                countForDay(
                    allQueries,
                    date,
                    item =>
                        item.aiProcessed ===
                        true
                )
        );


    const answeredData =
        days.map(
            date =>
                countForDay(
                    allQueries,
                    date,
                    item =>
                        item.aiAnswered ===
                        true
                )
        );


    if (
        processingChart
    ) {

        processingChart.destroy();

    }


    processingChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "AI Processed",

                            data:
                                processedData,

                            tension:
                                0.35,

                            borderWidth:
                                2,

                            fill:
                                false

                        },

                        {

                            label:
                                "AI Answered",

                            data:
                                answeredData,

                            tension:
                                0.35,

                            borderWidth:
                                2,

                            fill:
                                false

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    }

                }

            }
        );

}



/* =========================================
   RESOLUTION CHART
========================================= */

function renderResolutionChart() {

    const canvas =
        document.getElementById(
            "resolutionChart"
        );


    const processed =
        allQueries.filter(
            item =>
                item.aiProcessed ===
                true
        ).length;


    const answered =
        allQueries.filter(
            item =>
                item.aiAnswered ===
                true
        ).length;


    const escalated =
        Math.max(
            processed -
            answered,
            0
        );


    const other =
        Math.max(
            allQueries.length -
            processed,
            0
        );


    if (
        resolutionChart
    ) {

        resolutionChart.destroy();

    }


    resolutionChart =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels: [

                        "AI Answered",

                        "AI Escalated",

                        "Not AI Processed"

                    ],

                    datasets: [

                        {

                            data: [

                                answered,

                                escalated,

                                other

                            ]

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}



/* =========================================
   CONFIDENCE CHART
========================================= */

function renderConfidenceChart() {

    const canvas =
        document.getElementById(
            "confidenceChart"
        );


    const values =
        allQueries
            .filter(
                item =>
                    item.aiProcessed ===
                        true &&
                    item.aiConfidence !==
                        undefined &&
                    item.aiConfidence !==
                        null
            )
            .map(
                item =>
                    normalizeScore(
                        item.aiConfidence
                    )
            );


    const ranges = {

        "Low (<60%)":
            values.filter(
                value =>
                    value < 60
            ).length,

        "Medium (60-79%)":
            values.filter(
                value =>
                    value >= 60 &&
                    value < 80
            ).length,

        "High (≥80%)":
            values.filter(
                value =>
                    value >= 80
            ).length

    };


    if (
        confidenceChart
    ) {

        confidenceChart.destroy();

    }


    confidenceChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        Object.keys(
                            ranges
                        ),

                    datasets: [

                        {

                            label:
                                "Queries",

                            data:
                                Object.values(
                                    ranges
                                ),

                            borderRadius:
                                7

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    }

                }

            }
        );

}



/* =========================================
   ESCALATION CHART
========================================= */

function renderEscalationChart() {

    const canvas =
        document.getElementById(
            "escalationChart"
        );


    const escalationQueries =
        allQueries.filter(
            item =>
                item.aiProcessed ===
                    true &&
                item.aiAnswered !==
                    true
        );


    const reasons = {};


    escalationQueries.forEach(
        item => {

            const reason =
                item.aiEscalationReason ||
                "Unknown / Not specified";


            reasons[reason] =
                (
                    reasons[reason] ||
                    0
                ) + 1;

        }
    );


    const sorted =
        Object.entries(
            reasons
        )
        .sort(
            (a, b) =>
                b[1] -
                a[1]
        )
        .slice(
            0,
            6
        );


    if (
        escalationChart
    ) {

        escalationChart.destroy();

    }


    escalationChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        sorted.map(
                            item =>
                                truncate(
                                    item[0],
                                    25
                                )
                        ),

                    datasets: [

                        {

                            label:
                                "Escalated Queries",

                            data:
                                sorted.map(
                                    item =>
                                        item[1]
                                ),

                            borderRadius:
                                7

                        }

                    ]

                },

                options: {

                    indexAxis:
                        "y",

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    },

                    scales: {

                        x: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    }

                }

            }
        );

}



/* =========================================
   RECENT ACTIVITY
========================================= */

function renderRecentActivity() {

    const table =
        document.getElementById(
            "activityTable"
        );


    const aiQueries =
        allQueries
            .filter(
                item =>
                    item.aiProcessed ===
                    true
            )
            .sort(
                (a, b) =>
                    getTimestamp(
                        b.createdAt
                    )
                    -
                    getTimestamp(
                        a.createdAt
                    )
            )
            .slice(
                0,
                10
            );


    document.getElementById(
        "activityCount"
    ).textContent =
        `${aiQueries.length} records`;


    table.innerHTML =
        "";


    if (
        aiQueries.length ===
        0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-table"
                >
                    No AI activity found.
                </td>

            </tr>

        `;

        return;

    }


    aiQueries.forEach(
        item => {

            const row =
                document.createElement(
                    "tr"
                );


            const confidence =
                item.aiConfidence !==
                    undefined &&
                item.aiConfidence !==
                    null
                    ? normalizeScore(
                        item.aiConfidence
                    )
                    : null;


            const answered =
                item.aiAnswered ===
                true;


            const assigned =
                item.assignedFacultyId
                    ? "Assigned"
                    : "Unassigned";


            row.innerHTML = `

                <td>

                    <div class="table-query">

                        <strong>
                            ${escapeHTML(
                                item.title ||
                                "Untitled Query"
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.studentId ||
                                "Unknown student"
                            )}
                        </small>

                    </div>

                </td>


                <td>
                    ${escapeHTML(
                        item.department ||
                        "General"
                    )}
                </td>


                <td>

                    ${
                        confidence !== null
                            ? `
                                <span
                                    class="confidence-badge ${
                                        confidence >= 80
                                            ? "high"
                                            : confidence >= 60
                                                ? "medium"
                                                : "low"
                                    }"
                                >
                                    ${confidence.toFixed(1)}%
                                </span>
                              `
                            : "N/A"
                    }

                </td>


                <td>

                    <span
                        class="result-badge ${
                            answered
                                ? "answered"
                                : "escalated"
                        }"
                    >

                        ${
                            answered
                                ? "AI Answered"
                                : "Escalated"
                        }

                    </span>

                </td>


                <td>
                    ${assigned}
                </td>


                <td>
                    ${formatRelativeTime(
                        item.createdAt
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
   LOW CONFIDENCE
========================================= */

function renderLowConfidenceQueries() {

    const container =
        document.getElementById(
            "lowConfidenceList"
        );


    const lowQueries =
        allQueries
            .filter(
                item => {

                    if (
                        item.aiConfidence ===
                        undefined ||
                        item.aiConfidence ===
                        null
                    ) {

                        return false;

                    }


                    return (
                        normalizeScore(
                            item.aiConfidence
                        ) < 60
                    );

                }
            )
            .sort(
                (a, b) =>
                    normalizeScore(
                        a.aiConfidence
                    )
                    -
                    normalizeScore(
                        b.aiConfidence
                    )
            )
            .slice(
                0,
                8
            );


    container.innerHTML =
        "";


    if (
        lowQueries.length ===
        0
    ) {

        container.innerHTML = `

            <div class="no-low-confidence">

                <span>
                    ✓
                </span>

                <div>

                    <strong>
                        No low-confidence queries
                    </strong>

                    <p>
                        No query currently has an AI confidence below 60%.
                    </p>

                </div>

            </div>

        `;

        return;

    }


    lowQueries.forEach(
        item => {

            const confidence =
                normalizeScore(
                    item.aiConfidence
                );


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "low-query";


            element.innerHTML = `

                <div class="low-query-main">

                    <strong>
                        ${escapeHTML(
                            item.title ||
                            "Untitled Query"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.department ||
                            "General"
                        )}
                        •
                        ${escapeHTML(
                            item.studentId ||
                            "Unknown student"
                        )}
                    </span>

                </div>


                <div class="low-query-right">

                    <span class="low-confidence-badge">

                        ${confidence.toFixed(1)}%

                    </span>

                    <span>

                        ${
                            item.aiEscalationReason ||
                            "Review recommended"
                        }

                    </span>

                </div>

            `;


            container.appendChild(
                element
            );

        }
    );

}



/* =========================================
   COUNT FOR DAY
========================================= */

function countForDay(
    array,
    targetDate,
    condition
) {

    const start =
        new Date(
            targetDate
        );


    start.setHours(
        0,
        0,
        0,
        0
    );


    const end =
        new Date(
            start
        );


    end.setDate(
        end.getDate() +
        1
    );


    return array.filter(
        item => {

            if (
                !condition(
                    item
                )
            ) {

                return false;

            }


            const timestamp =
                getTimestamp(
                    item.createdAt
                );


            return (
                timestamp >=
                start.getTime()
                &&
                timestamp <
                end.getTime()
            );

        }
    ).length;

}



/* =========================================
   NORMALIZE SCORE
========================================= */

function normalizeScore(
    value
) {

    let score =
        Number(
            value
        );


    if (
        isNaN(score)
    ) {

        return 0;

    }


    /*
       Firestore may contain:
       0.91  -> 91%
       91    -> 91%
    */

    if (
        score <=
        1
    ) {

        score *=
            100;

    }


    return Math.max(
        0,
        Math.min(
            score,
            100
        )
    );

}



/* =========================================
   AVERAGE
========================================= */

function average(
    values
) {

    if (
        values.length ===
        0
    ) {

        return 0;

    }


    return (
        values.reduce(
            (
                total,
                value
            ) =>
                total +
                value,
            0
        )
        /
        values.length
    );

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


    return new Date(
        timestamp
    ).toLocaleDateString(
        "en-IN"
    );

}



/* =========================================
   TRUNCATE
========================================= */

function truncate(
    value,
    length
) {

    const text =
        String(
            value ||
            ""
        );


    return text.length >
        length

        ? text.substring(
            0,
            length
        ) + "..."

        : text;

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



/* =========================================
   REFRESH
========================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        await loadMonitoringData();

        showToast(
            "AI monitoring data refreshed.",
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