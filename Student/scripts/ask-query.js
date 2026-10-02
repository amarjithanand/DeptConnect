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
    serverTimestamp,
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

let currentAIResult = null;


/* =========================================
   API CONFIGURATION
========================================= */

const AI_API_URL =
    "http://127.0.0.1:8000";


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

        /*
         * IMPORTANT:
         *
         * Do NOT print Firebase ID tokens
         * in the browser console.
         */

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

        const studentRef =
            collection(
                db,
                "students"
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

        if (snapshot.empty) {

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

        setStudentDepartment(
            studentData.department
        );

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
        name
            .trim()
            .split(/\s+/);

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
               GET FORM VALUES
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
             * HTML:
             *
             * normal
             *
             * Firestore:
             *
             * medium
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
                   STEP 1
                ============================= */

                updateProcessingStep(
                    "step1",
                    "completed"
                );


                /* =============================
                   STEP 2
                   CREATE QUERY
                ============================= */

                updateProcessingStep(
                    "step2",
                    "active"
                );


                /*
                 * Firestore query structure
                 */

                const queryData = {

                    uid:
                        currentUser.uid,

                    studentId:
                        currentUser.uid,

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

                    status:
                        "pending",

                    aiProcessed:
                        false,

                    aiAnswered:
                        false,

                    aiConfidence:
                        0,

                    assignedFacultyId:
                        "nil",

                    similiarQueryId:
                        "nil",

                    createdAt:
                        serverTimestamp(),

                    resolvedAt:
                        "nil"

                };


                /*
                 * Save query to Firestore
                 */

                const queryDocument =
                    await addDoc(
                        collection(
                            db,
                            "queries"
                        ),
                        queryData
                    );


                /*
                 * Save generated query ID
                 */

                submittedQueryId =
                    queryDocument.id;


                console.log(
                    "Query created:",
                    submittedQueryId
                );


                /* =============================
                   STEP 2 COMPLETE
                ============================= */

                updateProcessingStep(
                    "step2",
                    "completed"
                );


                /* =============================
                   STEP 3
                   AI PROCESSING
                ============================= */

                updateProcessingStep(
                    "step3",
                    "active"
                );


                console.log(
                    "Starting DeptConnect AI processing..."
                );


                /*
                 * Call AI backend
                 *
                 * IMPORTANT:
                 * No Firebase ID token is sent.
                 */

                const aiResponse =
                    await fetch(
                        `${AI_API_URL}/process-query`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    queryId:
                                        submittedQueryId
                                })
                        }
                    );


                let aiResult;

                try {

                    aiResult =
                        await aiResponse.json();

                } catch (parseError) {

                    throw new Error(
                        "AI service returned an invalid response."
                    );

                }


                console.log(
                    "AI response:",
                    aiResult
                );


                if (!aiResponse.ok) {

                    throw new Error(
                        aiResult.detail ||
                        aiResult.message ||
                        "AI processing failed."
                    );

                }


                currentAIResult =
                    aiResult;


                /* =============================
                   STEP 3 COMPLETE
                ============================= */

                updateProcessingStep(
                    "step3",
                    "completed"
                );


                /* =============================
                   STEP 4
                   ANALYSIS COMPLETE
                ============================= */

                updateProcessingStep(
                    "step4",
                    "active"
                );


                await delay(
                    500
                );


                updateProcessingStep(
                    "step4",
                    "completed"
                );


                await delay(
                    300
                );


                /* =============================
                   SHOW AI RESULT
                ============================= */

                showAIResult(
                    aiResult
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
   SHOW AI RESULT
========================================= */

function showAIResult(
    aiResult
) {

    if (
        !processingState ||
        !resultState ||
        !aiModal
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


    const hasAIAnswer =
        aiResult &&
        aiResult.aiAnswered === true &&
        typeof aiResult.aiAnswer === "string" &&
        aiResult.aiAnswer.trim().length > 0;


    if (similarity) {

        if (
            typeof aiResult.similarity ===
            "number"
        ) {

            similarity.textContent =
                `${(
                    aiResult.similarity * 100
                ).toFixed(1)}% similarity`;

        } else {

            similarity.textContent =
                "No similar query found";

        }

    }


    if (nextStep) {

        nextStep.textContent =
            hasAIAnswer
                ? "AI answer generated"
                : "Faculty review required";

    }


    /*
     * Display actual AI answer.
     */

    showAIAnswer(
        aiResult
    );


    /*
     * If AI generated a valid answer,
     * ask student whether it solved
     * the query.
     */

    if (hasAIAnswer) {

        showAIFeedback(
            aiResult
        );

    } else {

        showNoAIAnswerState(
            aiResult
        );

    }

}


/* =========================================
   DISPLAY AI ANSWER
========================================= */

function showAIAnswer(
    aiResult
) {

    let answerContainer =
        document.getElementById(
            "aiAnswerContainer"
        );


    if (!answerContainer) {

        answerContainer =
            document.createElement(
                "div"
            );

        answerContainer.id =
            "aiAnswerContainer";


        answerContainer.style.marginTop =
            "20px";

        answerContainer.style.padding =
            "18px";

        answerContainer.style.borderRadius =
            "12px";

        answerContainer.style.background =
            "#f8fafc";

        answerContainer.style.border =
            "1px solid #e2e8f0";

        answerContainer.style.textAlign =
            "left";


        /*
         * Insert before buttons /
         * continue button.
         */

        const feedbackContainer =
            document.getElementById(
                "aiFeedbackContainer"
            );


        if (feedbackContainer) {

            resultState.insertBefore(
                answerContainer,
                feedbackContainer
            );

        } else if (continueButton) {

            resultState.insertBefore(
                answerContainer,
                continueButton
            );

        } else {

            resultState.appendChild(
                answerContainer
            );

        }

    }


    const aiAnswer =
        aiResult &&
        aiResult.aiAnswer
            ? aiResult.aiAnswer
            : null;


    if (!aiAnswer) {

        answerContainer.innerHTML = `
            <div style="
                font-weight:600;
                margin-bottom:8px;
            ">
                AI Response
            </div>

            <div style="
                color:#64748b;
                line-height:1.6;
            ">
                No AI answer was generated.
                Your query will require faculty review.
            </div>
        `;

        return;
    }


    answerContainer.innerHTML = `

        <div style="
            font-weight:700;
            font-size:16px;
            margin-bottom:10px;
        ">
            AI Answer
        </div>

        <div style="
            color:#334155;
            line-height:1.7;
            white-space:pre-wrap;
        ">
            ${escapeHTML(aiAnswer)}
        </div>

    `;

}


/* =========================================
   AI FEEDBACK BUTTONS
========================================= */

function showAIFeedback(
    aiResult
) {

    let feedbackContainer =
        document.getElementById(
            "aiFeedbackContainer"
        );


    if (!feedbackContainer) {

        feedbackContainer =
            document.createElement(
                "div"
            );

        feedbackContainer.id =
            "aiFeedbackContainer";


        feedbackContainer.style.marginTop =
            "20px";


        feedbackContainer.style.textAlign =
            "center";


        /*
         * Insert before Continue button.
         */

        if (continueButton) {

            resultState.insertBefore(
                feedbackContainer,
                continueButton
            );

        } else {

            resultState.appendChild(
                feedbackContainer
            );

        }

    }


    feedbackContainer.innerHTML = `

        <div style="
            font-weight:600;
            margin-bottom:12px;
        ">
            Did this answer solve your query?
        </div>

        <div style="
            display:flex;
            gap:10px;
            justify-content:center;
            flex-wrap:wrap;
        ">

            <button
                type="button"
                id="aiAcceptButton"
                style="
                    padding:11px 18px;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                    background:#16a34a;
                    color:white;
                    font-weight:600;
                "
            >
                ✓ Yes, this solved my query
            </button>

            <button
                type="button"
                id="aiRejectButton"
                style="
                    padding:11px 18px;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                    background:#dc2626;
                    color:white;
                    font-weight:600;
                "
            >
                No, I need faculty help
            </button>

        </div>
    `;


    const acceptButton =
        document.getElementById(
            "aiAcceptButton"
        );


    const rejectButton =
        document.getElementById(
            "aiRejectButton"
        );


    if (acceptButton) {

        acceptButton.addEventListener(
            "click",
            () => {

                confirmAIAnswer(
                    aiResult
                );

            }
        );

    }


    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            () => {

                escalateToFaculty(
                    aiResult
                );

            }
        );

    }

}


/* =========================================
   NO AI ANSWER STATE
========================================= */

function showNoAIAnswerState(
    aiResult
) {

    let feedbackContainer =
        document.getElementById(
            "aiFeedbackContainer"
        );


    if (!feedbackContainer) {

        feedbackContainer =
            document.createElement(
                "div"
            );

        feedbackContainer.id =
            "aiFeedbackContainer";


        feedbackContainer.style.marginTop =
            "20px";


        feedbackContainer.style.padding =
            "15px";


        feedbackContainer.style.borderRadius =
            "10px";


        feedbackContainer.style.background =
            "#fff7ed";


        feedbackContainer.style.color =
            "#9a3412";


        if (continueButton) {

            resultState.insertBefore(
                feedbackContainer,
                continueButton
            );

        } else {

            resultState.appendChild(
                feedbackContainer
            );

        }

    }


    feedbackContainer.innerHTML = `

        <div style="
            font-weight:700;
            margin-bottom:8px;
        ">
            Faculty Review Required
        </div>

        <div style="
            line-height:1.6;
        ">
            No sufficiently similar resolved
            academic query was found.
            Your query needs faculty assistance.
        </div>

        <button
            type="button"
            id="noResultEscalateButton"
            style="
                margin-top:14px;
                padding:10px 18px;
                border:none;
                border-radius:8px;
                background:#2563eb;
                color:white;
                cursor:pointer;
                font-weight:600;
            "
        >
            Forward to Faculty
        </button>

    `;


    const button =
        document.getElementById(
            "noResultEscalateButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {

                escalateToFaculty(
                    aiResult
                );

            }
        );

    }

}


/* =========================================
   AI CONFIRM
========================================= */

async function confirmAIAnswer(
    aiResult
) {

    if (!submittedQueryId) {

        showFormError(
            "Query ID is missing."
        );

        return;
    }


    disableAIFeedbackButtons();


    try {

        console.log(
            "Confirming AI answer..."
        );


        const response =
            await fetch(
                `${AI_API_URL}/ai-confirm`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            queryId:
                                submittedQueryId,

                            aiAnswer:
                                aiResult.aiAnswer,

                            similarity:
                                typeof aiResult.similarity ===
                                "number"
                                    ? aiResult.similarity
                                    : 0,

                            similarQueryId:
                                aiResult.similarQueryId ||
                                "nil"

                        })

                }
            );


        let result;


        try {

            result =
                await response.json();

        } catch (error) {

            result = {};

        }


        console.log(
            "AI confirm response:",
            result
        );


        if (!response.ok) {

            throw new Error(
                result.detail ||
                result.message ||
                "Unable to confirm AI answer."
            );

        }


        /*
         * Update UI.
         */

        showConfirmationMessage(
            "Your query has been resolved by AI."
        );


        /*
         * Continue button remains available.
         */

    } catch (error) {

        console.error(
            "AI confirmation error:",
            error
        );


        enableAIFeedbackButtons();


        showFormError(
            error.message ||
            "Unable to confirm AI answer."
        );

    }

}


/* =========================================
   ESCALATE TO FACULTY
========================================= */

async function escalateToFaculty(
    aiResult
) {

    if (!submittedQueryId) {

        showFormError(
            "Query ID is missing."
        );

        return;
    }


    disableAIFeedbackButtons();


    try {

        console.log(
            "Escalating query to faculty..."
        );


        /*
         * IMPORTANT:
         *
         * No Firebase Authorization token
         * is sent here.
         *
         * The AI backend handles the
         * secure internal call to:
         *
         * /assign-faculty-internal
         */

        const response =
            await fetch(
                `${AI_API_URL}/ai-escalate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            queryId:
                                submittedQueryId,

                            similarity:
                                typeof aiResult?.similarity ===
                                "number"
                                    ? aiResult.similarity
                                    : 0,

                            similarQueryId:
                                aiResult?.similarQueryId ||
                                "nil"

                        })

                }
            );


        let result;


        try {

            result =
                await response.json();

        } catch (error) {

            result = {};

        }


        console.log(
            "AI escalation response:",
            result
        );


        if (!response.ok) {

            throw new Error(
                result.detail ||
                result.message ||
                "Unable to forward query to faculty."
            );

        }


        /*
         * Show successful escalation.
         */

        showConfirmationMessage(
            "Your query has been forwarded to the appropriate faculty member."
        );


    } catch (error) {

        console.error(
            "Faculty escalation error:",
            error
        );


        enableAIFeedbackButtons();


        showFormError(
            error.message ||
            "Unable to forward the query to faculty."
        );

    }

}


/* =========================================
   DISABLE AI FEEDBACK BUTTONS
========================================= */

function disableAIFeedbackButtons() {

    const buttons =
        document.querySelectorAll(
            "#aiFeedbackContainer button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;

            button.style.opacity =
                "0.6";

            button.style.cursor =
                "not-allowed";

        }
    );

}


/* =========================================
   ENABLE AI FEEDBACK BUTTONS
========================================= */

function enableAIFeedbackButtons() {

    const buttons =
        document.querySelectorAll(
            "#aiFeedbackContainer button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                false;

            button.style.opacity =
                "1";

            button.style.cursor =
                "pointer";

        }
    );

}


/* =========================================
   CONFIRMATION MESSAGE
========================================= */

function showConfirmationMessage(
    message
) {

    let container =
        document.getElementById(
            "aiConfirmationMessage"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "aiConfirmationMessage";


        container.style.marginTop =
            "18px";


        container.style.padding =
            "14px";


        container.style.borderRadius =
            "10px";


        container.style.background =
            "#ecfdf5";


        container.style.color =
            "#166534";


        container.style.fontWeight =
            "600";


        if (continueButton) {

            resultState.insertBefore(
                container,
                continueButton
            );

        } else {

            resultState.appendChild(
                container
            );

        }

    }


    container.textContent =
        message;


    /*
     * Remove feedback buttons after
     * successful action.
     */

    const feedback =
        document.getElementById(
            "aiFeedbackContainer"
        );


    if (feedback) {

        feedback.remove();

    }

}


/* =========================================
   CLOSE AI MODAL
========================================= */

function closeAiModal() {

    if (!aiModal) {

        return;
    }


    aiModal.classList.remove(
        "show"
    );

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
             * Don't allow accidental closing
             * while AI processing is running.
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
   HTML ESCAPE
========================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

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

            return (
                "You do not have permission to submit this query."
            );


        case "storage/unauthorized":

            return (
                "You do not have permission to upload this file."
            );


        case "storage/quota-exceeded":

            return (
                "Storage limit has been exceeded."
            );


        case "storage/canceled":

            return (
                "File upload was cancelled."
            );


        case "storage/invalid-format":

            return (
                "The uploaded file format is not supported."
            );


        case "network-request-failed":

            return (
                "Network error. Please check your internet connection."
            );


        default:

            return (
                error.message ||
                "Unable to submit your query."
            );

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