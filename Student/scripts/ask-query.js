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
    addDoc,
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

const queryForm =
    document.getElementById("queryForm");

const department =
    document.getElementById("department");

const subject =
    document.getElementById("subject");

const queryTitle =
    document.getElementById("queryTitle");

const description =
    document.getElementById("description");

const characterCount =
    document.getElementById("characterCount");

const submitButton =
    document.getElementById("submitButton");

const notificationButton =
    document.getElementById("notificationButton");

const profileButton =
    document.getElementById("profileButton");

const profileMenu =
    document.getElementById("profileMenu");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================
   AI MODAL
========================================= */

const aiModal =
    document.getElementById("aiModal");

const processingState =
    document.getElementById("processingState");

const resultState =
    document.getElementById("resultState");

const continueButton =
    document.getElementById("continueButton");


/* =========================================
   GLOBAL STATE
========================================= */

let currentUser = null;

let studentData = null;

let submittedQueryId = null;


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        currentUser = user;

        console.log(
            "Authenticated UID:",
            user.uid
        );

        await loadStudentProfile(
            user.uid
        );
    }
);


/* =========================================
   LOAD STUDENT PROFILE
========================================= */

async function loadStudentProfile(uid) {

    try {

        /*
         * Student document ID is different
         * from Firebase Auth UID.
         *
         * Therefore query using uid field.
         */

        const studentRef =
            collection(
                db,
                "students"
            );


        /*
         * Import Firestore query functions.
         */

        const {
            query,
            where,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"
        );


        const studentQuery =
            query(
                studentRef,
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


        if (
            snapshot.empty
        ) {

            console.error(
                "Student profile not found."
            );

            showFormError(
                "Student profile could not be found."
            );

            return;
        }


        studentData =
            snapshot.docs[0].data();


        console.log(
            "Student profile loaded:",
            studentData
        );


        /*
         * Automatically set student's
         * department.
         */

        setStudentDepartment(
            studentData.department
        );


        /*
         * Update profile avatar.
         */

        updateProfileAvatar(
            studentData.name
        );

    } catch (error) {

        console.error(
            "Error loading student profile:",
            error
        );

    }
}


/* =========================================
   SET STUDENT DEPARTMENT
========================================= */

function setStudentDepartment(
    studentDepartment
) {

    if (
        !studentDepartment ||
        !department
    ) {

        return;
    }


    const normalized =
        studentDepartment
            .trim()
            .toLowerCase();


    let matchingOption = null;


    for (
        const option
        of department.options
    ) {

        if (
            option.textContent
                .trim()
                .toLowerCase()
            ===
            normalized
        ) {

            matchingOption =
                option;

            break;
        }
    }


    /*
     * If department is not already
     * available, add it dynamically.
     */

    if (!matchingOption) {

        matchingOption =
            document.createElement(
                "option"
            );

        matchingOption.value =
            studentDepartment;

        matchingOption.textContent =
            studentDepartment;

        department.appendChild(
            matchingOption
        );
    }


    department.value =
        matchingOption.value;

}


/* =========================================
   PROFILE AVATAR
========================================= */

function updateProfileAvatar(
    name
) {

    if (!profileButton) {

        return;
    }


    const avatar =
        profileButton.querySelector(
            ".profile-avatar"
        );


    if (!avatar) {

        return;
    }


    if (!name) {

        avatar.textContent =
            "A";

        return;
    }


    const parts =
        name.trim().split(
            /\s+/
        );


    const initials =
        parts.length >= 2
            ? parts[0][0] +
              parts[parts.length - 1][0]
            : parts[0][0];


    avatar.textContent =
        initials.toUpperCase();

}


/* =========================================
   CHARACTER COUNTER
========================================= */

if (
    description &&
    characterCount
) {

    description.addEventListener(
        "input",
        () => {

            characterCount.textContent =
                `${description.value.length} / 1500`;

        }
    );

}


/* =========================================
   FORM SUBMISSION
========================================= */

if (queryForm) {

    queryForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            /* =============================
               AUTHENTICATION CHECK
            ============================= */

            if (!currentUser) {

                showFormError(
                    "Please sign in again."
                );

                return;
            }


            /* =============================
               GET VALUES
            ============================= */

            const departmentValue =
                department.value.trim();


            const courseValue =
                subject.value.trim();


            const titleValue =
                queryTitle.value.trim();


            const descriptionValue =
                description.value.trim();


            const priorityInput =
                document.querySelector(
                    'input[name="priority"]:checked'
                );


            const selectedPriority =
                priorityInput
                    ? priorityInput.value
                    : "normal";


            /*
             * Firestore uses:
             * low
             * medium
             * high
             *
             * HTML uses:
             * low
             * normal
             * high
             *
             * Convert normal → medium.
             */

            const priority =
                selectedPriority === "normal"
                    ? "medium"
                    : selectedPriority;


            /* =============================
               VALIDATION
            ============================= */

            if (!departmentValue) {

                showFormError(
                    "Please select a department."
                );

                return;
            }


            if (!courseValue) {

                showFormError(
                    "Please enter the subject or course."
                );

                return;
            }


            if (!titleValue) {

                showFormError(
                    "Please enter a query title."
                );

                return;
            }


            if (!descriptionValue) {

                showFormError(
                    "Please describe your query."
                );

                return;
            }


            if (
                descriptionValue.length >
                1500
            ) {

                showFormError(
                    "Query description cannot exceed 1500 characters."
                );

                return;
            }


            /* =============================
               DISABLE BUTTON
            ============================= */

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML = `
                    <span>
                        Submitting...
                    </span>

                    <span>
                        ⏳
                    </span>
                `;
            }


            try {

                /* =============================
                   START AI MODAL
                ============================= */

                showProcessingModal();


                /* =============================
                   CREATE QUERY
                ============================= */

                updateProcessingStep(
                    "step1",
                    "completed"
                );


                updateProcessingStep(
                    "step2",
                    "active"
                );


                /*
                 * Query document structure
                 */

                const queryData = {

                    /*
                     * Firebase Auth UID
                     */

                    uid:
                        currentUser.uid,


                    /*
                     * Current database uses
                     * Auth UID as studentId.
                     */

                    studentId:
                        currentUser.uid,


                    /*
                     * Form data
                     */

                    title:
                        titleValue,

                    description:
                        descriptionValue,

                    course:
                        courseValue,

                    department:
                        departmentValue,

                    priority:
                        priority,


                    /*
                     * Initial processing state
                     */

                    status:
                        "pending",

                    aiProcessed:
                        false,

                    aiAnswered:
                        false,

                    aiConfidence:
                        0,


                    /*
                     * Faculty assignment
                     */

                    assignedFacultyId:
                        "nil",


                    /*
                     * Similar query
                     */

                    similiarQueryId:
                        "nil",


                    /*
                     * Timestamps
                     */

                    createdAt:
                        serverTimestamp(),

                    resolvedAt:
                        "nil"
                };


                /*
                 * Save query to Firestore.
                 */

                const queryDocument =
                    await addDoc(
                        collection(
                            db,
                            "queries"
                        ),
                        queryData
                    );


                /* =========================================
                   IMPORTANT:
                   SAVE QUERY ID IMMEDIATELY
                ========================================= */

                submittedQueryId =
                    queryDocument.id;


                console.log(
                    "Query created:",
                    submittedQueryId
                );


                /* =========================================
                   AUTOMATIC FACULTY ASSIGNMENT
                ========================================= */

                try {

                    console.log(
                        "Starting automatic faculty assignment..."
                    );


                    /* -------------------------------------
                       Get Firebase Authentication ID Token
                    ------------------------------------- */

                    const idToken =
                        await currentUser.getIdToken();


                    /* -------------------------------------
                       Prepare request body
                    ------------------------------------- */

                    const requestBody = {

                        queryId:
                            submittedQueryId

                    };


                    console.log(
                        "Assignment request:",
                        requestBody
                    );


                    /* -------------------------------------
                       Call FastAPI
                    ------------------------------------- */

                    const assignmentResponse =
                        await fetch(
                            "http://127.0.0.1:8000/assign-faculty",
                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${idToken}`

                                },

                                body:
                                    JSON.stringify(
                                        requestBody
                                    )
                            }
                        );


                    /* -------------------------------------
                       Read API response
                    ------------------------------------- */

                    const assignmentResult =
                        await assignmentResponse.json();


                    console.log(
                        "Faculty assignment API response:",
                        assignmentResult
                    );


                    /* -------------------------------------
                       Check API response
                    ------------------------------------- */

                    if (
                        !assignmentResponse.ok
                    ) {

                        throw new Error(
                            assignmentResult.detail ||
                            "Faculty assignment failed."
                        );

                    }


                    /* -------------------------------------
                       Assignment successful
                    ------------------------------------- */

                    console.log(
                        "Faculty assigned successfully!"
                    );


                    if (
                        assignmentResult.assignedFaculty
                    ) {

                        console.log(
                            "Assigned Faculty:",
                            assignmentResult
                                .assignedFaculty
                                .name
                        );

                    }


                    console.log(
                        "Assignment Confidence:",
                        assignmentResult.confidence
                    );


                    console.log(
                        "Faculty Workload:",
                        assignmentResult.workload
                    );


                } catch (assignmentError) {

                    console.error(
                        "Faculty assignment error:",
                        assignmentError
                    );

                    /*
                     * The query is already stored
                     * in Firestore.
                     *
                     * Therefore don't delete
                     * the query if assignment fails.
                     */

                }


                /* =============================
                   PROCESSING UI
                ============================= */

                updateProcessingStep(
                    "step2",
                    "completed"
                );


                updateProcessingStep(
                    "step3",
                    "active"
                );


                /*
                 * Temporary AI processing
                 * animation.
                 */

                await delay(
                    700
                );


                updateProcessingStep(
                    "step3",
                    "completed"
                );


                updateProcessingStep(
                    "step4",
                    "active"
                );


                await delay(
                    700
                );


                updateProcessingStep(
                    "step4",
                    "completed"
                );


                await delay(
                    400
                );


                /*
                 * Show successful submission.
                 */

                showResultState(
                    departmentValue
                );


            } catch (error) {

                console.error(
                    "Error submitting query:",
                    error
                );


                closeAiModal();


                showFormError(
                    getFirebaseErrorMessage(
                        error
                    )
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;


                    submitButton.innerHTML = `
                        <span>
                            Submit Query
                        </span>

                        <span>
                            →
                        </span>
                    `;

                }

            }

        }
    );

}


/* =========================================
   PROCESSING MODAL
========================================= */

function showProcessingModal() {

    if (
        !processingState ||
        !resultState ||
        !aiModal
    ) {

        return;
    }


    processingState.style.display =
        "block";

    resultState.style.display =
        "none";


    resetProcessingSteps();


    aiModal.classList.add(
        "show"
    );

}


/* =========================================
   RESET PROCESSING STEPS
========================================= */

function resetProcessingSteps() {

    [
        "step1",
        "step2",
        "step3",
        "step4"
    ].forEach(
        id => {

            const step =
                document.getElementById(
                    id
                );


            if (!step) {

                return;
            }


            step.classList.remove(
                "active",
                "completed"
            );


            const icon =
                step.querySelector(
                    ".step-icon"
                );


            if (icon) {

                icon.textContent =
                    "○";
            }

        }
    );

}


/* =========================================
   UPDATE PROCESSING STEP
========================================= */

function updateProcessingStep(
    stepId,
    state
) {

    const step =
        document.getElementById(
            stepId
        );


    if (!step) {

        return;
    }


    step.classList.remove(
        "active",
        "completed"
    );


    step.classList.add(
        state
    );


    const icon =
        step.querySelector(
            ".step-icon"
        );


    if (!icon) {

        return;
    }


    if (
        state ===
        "completed"
    ) {

        icon.textContent =
            "✓";

    } else if (
        state ===
        "active"
    ) {

        icon.textContent =
            "●";

    } else {

        icon.textContent =
            "○";

    }

}


/* =========================================
   RESULT STATE
========================================= */

function showResultState(
    departmentValue
) {

    if (
        !processingState ||
        !resultState
    ) {

        return;
    }


    processingState.style.display =
        "none";

    resultState.style.display =
        "block";


    const category =
        document.getElementById(
            "resultCategory"
        );


    const similarity =
        document.getElementById(
            "resultSimilarity"
        );


    const nextStep =
        document.getElementById(
            "resultNextStep"
        );


    if (category) {

        category.textContent =
            "Academic Query";
    }


    if (similarity) {

        similarity.textContent =
            "Pending AI analysis";
    }


    if (nextStep) {

        nextStep.textContent =
            `Submitted to ${departmentValue}`;
    }

}


/* =========================================
   CONTINUE BUTTON
========================================= */

if (continueButton) {

    continueButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "my-queries.html";

        }
    );

}


/* =========================================
   MODAL CLOSE
========================================= */

if (aiModal) {

    aiModal.addEventListener(
        "click",
        event => {

            /*
             * Don't allow the student to
             * accidentally close the processing
             * modal while submission is happening.
             */

            if (
                event.target ===
                aiModal &&

                processingState &&

                processingState.style.display ===
                "none"
            ) {

                closeAiModal();

            }

        }
    );

}


/* =========================================
   DELAY
========================================= */

function delay(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================
   SANITIZE FILE NAME
========================================= */

function sanitizeFileName(
    fileName
) {

    return fileName
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


/* =========================================
   FORM ERROR
========================================= */

function showFormError(
    message
) {

    /*
     * Use browser alert for now.
     *
     * If your CSS already has a dedicated
     * error component, we can replace this
     * later.
     */

    alert(
        message
    );

}


/* =========================================
   FIREBASE ERROR MESSAGE
========================================= */

function getFirebaseErrorMessage(
    error
) {

    if (!error) {

        return "Something went wrong.";

    }


    switch (
        error.code
    ) {

        case "permission-denied":

            return "You do not have permission to submit this query.";


        case "storage/unauthorized":

            return "You do not have permission to upload this file.";


        case "storage/quota-exceeded":

            return "Storage limit has been exceeded.";


        case "storage/canceled":

            return "File upload was cancelled.";


        case "storage/invalid-format":

            return "The uploaded file format is not supported.";


        case "network-request-failed":

            return "Network error. Please check your internet connection.";


        default:

            return error.message ||
                "Unable to submit your query.";

    }

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
   NOTIFICATIONS
========================================= */

if (
    notificationButton
) {

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

if (
    logoutButton
) {

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