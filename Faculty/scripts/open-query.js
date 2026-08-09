import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   FIREBASE
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


const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =====================================================
   GLOBAL
===================================================== */

let currentUser = null;

let currentFaculty = null;

let currentQuery = null;


/* =====================================================
   DOM
===================================================== */

const loadingState =
    document.getElementById(
        "loadingState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const queryContent =
    document.getElementById(
        "queryContent"
    );

const responseForm =
    document.getElementById(
        "responseForm"
    );

const responseInput =
    document.getElementById(
        "response"
    );

const characterCount =
    document.getElementById(
        "characterCount"
    );

const responseError =
    document.getElementById(
        "responseError"
    );

const responseSuccess =
    document.getElementById(
        "responseSuccess"
    );

const submitButton =
    document.getElementById(
        "submitResponse"
    );

const submitText =
    document.getElementById(
        "submitText"
    );

const submitLoader =
    document.getElementById(
        "submitLoader"
    );


/* =====================================================
   QUERY ID
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const queryId =
    params.get(
        "id"
    );


if (!queryId) {

    showError(
        "No query ID was provided."
    );

}


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../faculty-login.html";

            return;

        }


        currentUser =
            user;


        console.log(
            "Authenticated Faculty UID:",
            user.uid
        );


        try {

            await loadFaculty(
                user.uid
            );


            await loadQuery(
                queryId,
                user.uid
            );


        } catch (error) {

            console.error(
                "Open query error:",
                error
            );


            showError(
                error.message ||
                "Unable to load query."
            );

        }

    }
);


/* =====================================================
   LOAD FACULTY
===================================================== */

async function loadFaculty(
    uid
) {

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


    document.getElementById(
        "facultyName"
    ).textContent =
        currentFaculty.name ||
        "Faculty";


    document.getElementById(
        "facultyDepartment"
    ).textContent =
        currentFaculty.department ||
        "Department";


    if (
        currentFaculty.profileImg
    ) {

        document.getElementById(
            "facultyAvatar"
        ).src =
            currentFaculty.profileImg;

    }

}


/* =====================================================
   LOAD QUERY
===================================================== */

async function loadQuery(
    id,
    facultyUid
) {

    if (!id) {

        throw new Error(
            "Invalid query ID."
        );

    }


    console.log(
        "Loading query:",
        id
    );


    const queryRef =
        doc(
            db,
            "queries",
            id
        );


    const querySnapshot =
        await getDoc(
            queryRef
        );


    if (
        !querySnapshot.exists()
    ) {

        throw new Error(
            "This query does not exist."
        );

    }


    const queryData =
        querySnapshot.data();


    /*
     * SECURITY CHECK
     *
     * Do not allow a faculty member to
     * open another faculty's query.
     */

    if (
        queryData.assignedFacultyId !==
        facultyUid
    ) {

        throw new Error(
            "This query is not assigned to you."
        );

    }


    currentQuery = {

        id: querySnapshot.id,

        ...queryData

    };


    renderQuery(
        currentQuery
    );

}


/* =====================================================
   RENDER QUERY
===================================================== */

function renderQuery(
    data
) {

    document.getElementById(
        "queryTitle"
    ).textContent =
        data.title ||
        "Untitled Query";


    document.getElementById(
        "queryDescription"
    ).textContent =
        data.description ||
        "No description available.";


    document.getElementById(
        "queryCourse"
    ).textContent =
        data.course ||
        "-";


    document.getElementById(
        "sideCourse"
    ).textContent =
        data.course ||
        "-";


    document.getElementById(
        "queryDepartment"
    ).textContent =
        data.department ||
        "-";


    document.getElementById(
        "queryDate"
    ).textContent =
        formatDate(
            data.createdAt
        );


    document.getElementById(
        "queryId"
    ).textContent =
        data.id;


    document.getElementById(
        "studentId"
    ).textContent =
        data.studentId ||
        "-";


    document.getElementById(
        "studentUid"
    ).textContent =
        data.uid ||
        "-";


    document.getElementById(
        "sidePriority"
    ).textContent =
        data.priority ||
        "-";


    document.getElementById(
        "aiProcessed"
    ).textContent =
        data.aiProcessed
            ? "Yes"
            : "No";


    document.getElementById(
        "aiAnswered"
    ).textContent =
        data.aiAnswered
            ? "Yes"
            : "No";


    document.getElementById(
        "aiConfidence"
    ).textContent =
        formatConfidence(
            data.aiConfidence
        );


    document.getElementById(
        "queryStatus"
    ).textContent =
        formatStatus(
            data.status
        );


    document.getElementById(
        "queryPriority"
    ).textContent =
        data.priority ||
        "medium";


    /*
     * If already resolved, don't allow
     * another response.
     */

    if (
        data.status ===
        "resolved"
    ) {

        responseInput.disabled =
            true;

        submitButton.disabled =
            true;

        submitText.textContent =
            "Query Already Resolved";

    }


    loadingState.style.display =
        "none";


    queryContent.style.display =
        "grid";

}


/* =====================================================
   SUBMIT RESPONSE
===================================================== */

responseForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        clearMessages();


        if (!currentQuery) {

            showResponseError(
                "Query information is not available."
            );

            return;

        }


        const responseText =
            responseInput.value.trim();


        if (
            responseText.length <
            10
        ) {

            showResponseError(
                "Please provide a meaningful response of at least 10 characters."
            );

            return;

        }


        if (
            currentQuery.status ===
            "resolved"
        ) {

            showResponseError(
                "This query has already been resolved."
            );

            return;

        }


        setSubmitting(
            true
        );


        try {

            await submitFacultyResponse(
                responseText
            );


            responseSuccess.textContent =
                "Response submitted successfully. The query has been marked as resolved.";


            responseSuccess.style.display =
                "block";


            responseInput.value =
                "";


            characterCount.textContent =
                "0";


            currentQuery.status =
                "resolved";


            document.getElementById(
                "queryStatus"
            ).textContent =
                "Resolved";


            responseInput.disabled =
                true;


            submitButton.disabled =
                true;


            submitText.textContent =
                "Response Submitted";


            /*
             * Redirect after a short delay
             */

            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                1800
            );


        } catch (error) {

            console.error(
                "Response submission error:",
                error
            );


            showResponseError(
                error.message ||
                "Unable to submit response."
            );


        } finally {

            setSubmitting(
                false
            );

        }

    }
);


/* =====================================================
   CREATE RESPONSE + UPDATE QUERY
===================================================== */

async function submitFacultyResponse(
    responseText
) {

    const responseRef =
        doc(
            collection(
                db,
                "responses"
            )
        );


    const queryRef =
        doc(
            db,
            "queries",
            currentQuery.id
        );


    /*
     * Batch ensures BOTH operations succeed
     * together.
     */

    const batch =
        writeBatch(
            db
        );


    /* =========================================
       RESPONSE DOCUMENT
    ========================================= */

    batch.set(
        responseRef,
        {

            // Faculty information
            uid:
                currentUser.uid,

            facultyId:
                currentFaculty.facultyId ||
                "",

            facultyName:
                currentFaculty.name ||
                "",


            // Query identity
            queryId:
                currentQuery.id,


            // Student identity
            studentId:
                currentQuery.studentId ||
                "",

            studentUid:
                currentQuery.uid ||
                "",


            // Query snapshot
            queryTitle:
                currentQuery.title ||
                "",

            queryDescription:
                currentQuery.description ||
                "",

            course:
                currentQuery.course ||
                "",

            department:
                currentQuery.department ||
                "",

            priority:
                currentQuery.priority ||
                "medium",


            // Faculty response
            response:
                responseText,


            // Response metadata
            respondedAt:
                serverTimestamp(),

            status:
                "resolved"

        }
    );


    /* =========================================
       UPDATE QUERY
    ========================================= */

    batch.update(
        queryRef,
        {

            status:
                "resolved",

            resolvedAt:
                serverTimestamp(),

            respondedBy:
                currentUser.uid,

            responseId:
                responseRef.id

        }
    );


    /* =========================================
       COMMIT
    ========================================= */

    await batch.commit();


    console.log(
        "Response created:",
        responseRef.id
    );


    console.log(
        "Query resolved:",
        currentQuery.id
    );

}


/* =====================================================
   CHARACTER COUNT
===================================================== */

responseInput.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            responseInput.value.length;

    }
);


/* =====================================================
   LOADING BUTTON
===================================================== */

function setSubmitting(
    submitting
) {

    submitButton.disabled =
        submitting;


    submitLoader.style.display =
        submitting
            ? "inline-block"
            : "none";


    submitText.textContent =
        submitting
            ? "Submitting..."
            : "Submit Response";

}


/* =====================================================
   MESSAGES
===================================================== */

function clearMessages() {

    responseError.style.display =
        "none";

    responseSuccess.style.display =
        "none";

}


function showResponseError(
    message
) {

    responseError.textContent =
        message;

    responseError.style.display =
        "block";

}


function showError(
    message
) {

    loadingState.style.display =
        "none";


    queryContent.style.display =
        "none";


    errorMessage.textContent =
        message;


    errorState.style.display =
        "block";

}


/* =====================================================
   HELPERS
===================================================== */

function formatDate(
    timestamp
) {

    if (!timestamp) {

        return "-";

    }


    let milliseconds;


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        milliseconds =
            timestamp.toMillis();

    } else if (
        timestamp.seconds
    ) {

        milliseconds =
            timestamp.seconds *
            1000;

    } else {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(
            milliseconds
        )
    );

}


function formatStatus(
    status
) {

    if (!status) {

        return "Pending";

    }


    return String(status)
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


function formatConfidence(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (
        number === 0
    ) {

        return "0";

    }


    /*
     * Supports either:
     *
     * 0.85 → 85%
     * 85   → 85%
     */

    return number <= 1
        ? `${Math.round(number * 100)}%`
        : `${Math.round(number)}%`;

}