console.log("🔥 ASK-QUERY.JS LOADED");

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


/* =========================================================
   FIREBASE
========================================================= */

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


/* =========================================================
   DOM ELEMENTS
========================================================= */

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


/* =========================================================
   AI MODAL
========================================================= */

const aiModal =
    document.getElementById("aiModal");

const processingState =
    document.getElementById("processingState");

const resultState =
    document.getElementById("resultState");

const continueButton =
    document.getElementById("continueButton");


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let studentData = null;

let submittedQueryId = null;

let currentAIResult = null;


/* =========================================================
   API CONFIGURATION
========================================================= */

const AI_API_URL =
    "http://127.0.0.1:8000";


/* =========================================================
   AUTHENTICATION
========================================================= */

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


/* =========================================================
   LOAD STUDENT PROFILE
========================================================= */

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


        showFormError(
            "Unable to load your student profile."
        );

    }

}


/* =========================================================
   SET STUDENT DEPARTMENT
========================================================= */

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


    let matchingOption =
        null;


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


/* =========================================================
   PROFILE AVATAR
========================================================= */

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


/* =========================================================
   CHARACTER COUNTER
========================================================= */

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


/* =========================================================
   FORM SUBMISSION
========================================================= */

if (queryForm) {

    queryForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            console.log(
                "🚀 SUBMIT HANDLER STARTED"
            );


            /* =========================================
               AUTHENTICATION CHECK
            ========================================= */

            if (!currentUser) {

                showFormError(
                    "Please sign in again."
                );

                return;

            }


            /* =========================================
               GET FORM VALUES
            ========================================= */

            const departmentValue =
                department?.value.trim() ||
                "";


            const courseValue =
                subject?.value.trim() ||
                "";


            const titleValue =
                queryTitle?.value.trim() ||
                "";


            const descriptionValue =
                description?.value.trim() ||
                "";


            const priorityInput =
                document.querySelector(
                    'input[name="priority"]:checked'
                );


            const selectedPriority =
                priorityInput?.value ||
                "normal";


            const priority =
                selectedPriority === "normal"
                    ? "medium"
                    : selectedPriority;


            console.log(
                "Form values:",
                {
                    department:
                        departmentValue,

                    course:
                        courseValue,

                    title:
                        titleValue,

                    descriptionLength:
                        descriptionValue.length,

                    priority:
                        priority
                }
            );


            /* =========================================
               VALIDATION
            ========================================= */

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


            /* =========================================
               DISABLE SUBMIT BUTTON
            ========================================= */

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

                /* =========================================
                   START AI MODAL
                ========================================= */

                showProcessingModal();


                /* =========================================
                   STEP 1
                ========================================= */

                updateProcessingStep(
                    "step1",
                    "completed"
                );


                /* =========================================
                   STEP 2
                   CREATE FIRESTORE QUERY
                ========================================= */

                updateProcessingStep(
                    "step2",
                    "active"
                );


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


                console.log(
                    "Creating Firestore query:",
                    queryData
                );


                const queryDocument =
                    await addDoc(
                        collection(
                            db,
                            "queries"
                        ),
                        queryData
                    );


                submittedQueryId =
                    queryDocument.id;


                console.log(
                    "Query created:",
                    submittedQueryId
                );


                updateProcessingStep(
                    "step2",
                    "completed"
                );


                /* =========================================
                   STEP 3
                   AI PROCESSING
                ========================================= */

                updateProcessingStep(
                    "step3",
                    "active"
                );


                console.log(
                    "🚀 AI FETCH START"
                );


                console.log(
                    "AI endpoint:",
                    `${AI_API_URL}/process-query`
                );


                console.log(
                    "Query ID sent to AI:",
                    submittedQueryId
                );


                const aiResponse =
                    await fetch(
                        `${AI_API_URL}/process-query`,
                        {

                            method:
                                "POST",

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


                console.log(
                    "AI HTTP status:",
                    aiResponse.status,
                    aiResponse.statusText
                );


                let aiResult;


                try {

                    aiResult =
                        await aiResponse.json();

                } catch (parseError) {

                    console.error(
                        "AI JSON parse error:",
                        parseError
                    );


                    throw new Error(
                        "AI service returned an invalid response."
                    );

                }


                console.log(
                    "========== AI RESPONSE RECEIVED =========="
                );


                console.log(
                    "AI response:",
                    aiResult
                );


                console.log(
                    "aiAnswered:",
                    aiResult?.aiAnswered
                );


                console.log(
                    "aiAnswer:",
                    aiResult?.aiAnswer
                );


                console.log(
                    "aiAnswer type:",
                    typeof aiResult?.aiAnswer
                );


                console.log(
                    "aiAnswer length:",
                    aiResult?.aiAnswer?.length
                );


                console.log(
                    "similarity:",
                    aiResult?.similarity
                );


                console.log(
                    "similarQueryId:",
                    aiResult?.similarQueryId
                );


                if (!aiResponse.ok) {

                    throw new Error(

                        aiResult?.detail ||

                        aiResult?.message ||

                        "AI processing failed."

                    );

                }


                currentAIResult =
                    aiResult;


                updateProcessingStep(
                    "step3",
                    "completed"
                );


                /* =========================================
                   STEP 4
                   ANALYSIS COMPLETE
                ========================================= */

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


                /* =========================================
                   SHOW AI RESULT
                ========================================= */

                console.log(
                    "========== BEFORE SHOW AI RESULT =========="
                );


                showAIResult(
                    aiResult
                );


                console.log(
                    "========== AFTER SHOW AI RESULT =========="
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


/* =========================================================
   PROCESSING MODAL
========================================================= */

function showProcessingModal() {

    console.log(
        "========== OPENING AI MODAL =========="
    );


    if (
        !processingState ||
        !resultState ||
        !aiModal
    ) {

        console.error(
            "AI modal elements are missing."
        );

        return;

    }


    /*
        Remove previous dynamic result elements.

        This prevents stale AI answers,
        feedback buttons and confirmation
        messages from remaining when a new
        query is submitted.
    */

    [

        "aiAnswerContainer",

        "aiFeedbackContainer",

        "aiConfirmationMessage"

    ].forEach(
        (id) => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.remove();

            }

        }
    );


    processingState.style.display =
        "block";


    processingState.style.visibility =
        "visible";


    resultState.style.display =
        "none";


    resultState.style.visibility =
        "hidden";


    resetProcessingSteps();


    aiModal.classList.add(
        "show"
    );


    console.log(
        "AI modal opened."
    );

}


/* =========================================================
   RESET PROCESSING STEPS
========================================================= */

function resetProcessingSteps() {

    [

        "step1",

        "step2",

        "step3",

        "step4"

    ].forEach(
        (id) => {

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


/* =========================================================
   UPDATE PROCESSING STEP
========================================================= */

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


/* =========================================================
   CREATE AI RESULT CONTAINERS
========================================================= */

function ensureAIResultContainers() {

    if (!resultState) {

        return null;

    }


    let answerContainer =
        document.getElementById(
            "aiAnswerContainer"
        );


    let feedbackContainer =
        document.getElementById(
            "aiFeedbackContainer"
        );


    /* =========================================
       ANSWER CONTAINER
    ========================================= */

    if (!answerContainer) {

        answerContainer =
            document.createElement(
                "div"
            );


        answerContainer.id =
            "aiAnswerContainer";


        answerContainer.style.display =
            "block";


        answerContainer.style.width =
            "100%";


        answerContainer.style.boxSizing =
            "border-box";


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


        answerContainer.style.position =
            "relative";


        answerContainer.style.zIndex =
            "2";


        if (
            continueButton &&
            continueButton.parentNode ===
                resultState
        ) {

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


    /* =========================================
       FEEDBACK CONTAINER
    ========================================= */

    if (!feedbackContainer) {

        feedbackContainer =
            document.createElement(
                "div"
            );


        feedbackContainer.id =
            "aiFeedbackContainer";


        feedbackContainer.style.display =
            "block";


        feedbackContainer.style.width =
            "100%";


        feedbackContainer.style.boxSizing =
            "border-box";


        feedbackContainer.style.marginTop =
            "20px";


        feedbackContainer.style.textAlign =
            "center";


        feedbackContainer.style.position =
            "relative";


        feedbackContainer.style.zIndex =
            "2";


        if (
            continueButton &&
            continueButton.parentNode ===
                resultState
        ) {

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


    return {

        answerContainer,

        feedbackContainer

    };

}


/* =========================================================
   SHOW AI RESULT
========================================================= */

function showAIResult(
    aiResult
) {

    console.log(
        "========== SHOW AI RESULT =========="
    );


    console.log(
        "Full AI Result:",
        aiResult
    );


    console.log(
        "aiAnswered:",
        aiResult?.aiAnswered
    );


    console.log(
        "aiAnswer:",
        aiResult?.aiAnswer
    );


    console.log(
        "aiAnswer length:",
        aiResult?.aiAnswer?.length
    );


    if (
        !processingState ||
        !resultState ||
        !aiModal
    ) {

        console.error(
            "Cannot render AI result: modal elements missing."
        );

        return;

    }


    /*
        IMPORTANT FIX:

        The frontend should not depend only
        on aiAnswered === true.

        If the backend actually returned
        a non-empty aiAnswer, display it.
    */

    const aiAnswer =
        typeof aiResult?.aiAnswer ===
            "string"

            ? aiResult.aiAnswer.trim()

            : "";


    const hasAIAnswer =
        aiAnswer.length >
        0;


    /* =========================================
       SWITCH FROM PROCESSING TO RESULT
    ========================================= */

    processingState.style.display =
        "none";


    processingState.style.visibility =
        "hidden";


    resultState.style.display =
        "block";


    resultState.style.visibility =
        "visible";


    /*
        Prevent long AI responses from
        being clipped by the modal.
    */

    resultState.style.maxHeight =
        "70vh";


    resultState.style.overflowY =
        "auto";


    resultState.style.overflowX =
        "hidden";


    resultState.style.boxSizing =
        "border-box";


    /* =========================================
       RESULT SUMMARY
    ========================================= */

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

        const score =
            Number(
                aiResult?.similarity
            );


        if (
            Number.isFinite(
                score
            )
        ) {

            similarity.textContent =
                `${(
                    score * 100
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


    /* =========================================
       CREATE CONTAINERS
    ========================================= */

    const containers =
        ensureAIResultContainers();


    if (!containers) {

        console.error(
            "Unable to create AI result containers."
        );

        return;

    }


    /* =========================================
       SHOW ACTUAL AI ANSWER
    ========================================= */

    showAIAnswer(
        aiResult
    );


    /* =========================================
       FEEDBACK / FACULTY FLOW
    ========================================= */

    if (hasAIAnswer) {

        showAIFeedback(
            aiResult
        );

    } else {

        showNoAIAnswerState(
            aiResult
        );

    }


    /*
        Force browser reflow.

        This helps ensure dynamically inserted
        content is painted immediately.
    */

    void resultState.offsetHeight;


    console.log(
        "AI answer rendered:",
        hasAIAnswer
    );


    console.log(
        "Answer container text length:",
        document
            .getElementById(
                "aiAnswerContainer"
            )
            ?.innerText
            ?.length
    );


    console.log(
        "========================================"
    );

}


/* =========================================================
   DISPLAY AI ANSWER
========================================================= */

function showAIAnswer(
    aiResult
) {

    console.log(
        "========== SHOW AI ANSWER =========="
    );


    const answerContainer =
        document.getElementById(
            "aiAnswerContainer"
        );


    if (!answerContainer) {

        console.error(
            "#aiAnswerContainer was not found."
        );

        return;

    }


    const aiAnswer =
        typeof aiResult?.aiAnswer ===
            "string"

            ? aiResult.aiAnswer.trim()

            : "";


    console.log(
        "Answer received:",
        aiAnswer
    );


    console.log(
        "Answer length:",
        aiAnswer.length
    );


    /*
        Remove previous answer content.
    */

    answerContainer.replaceChildren();


    answerContainer.style.display =
        "block";


    answerContainer.style.visibility =
        "visible";


    answerContainer.style.opacity =
        "1";


    /* =========================================
       HEADING
    ========================================= */

    const heading =
        document.createElement(
            "div"
        );


    heading.textContent =
        "AI Answer";


    heading.style.fontWeight =
        "700";


    heading.style.fontSize =
        "16px";


    heading.style.marginBottom =
        "10px";


    heading.style.color =
        "#0f172a";


    /* =========================================
       ANSWER TEXT
    ========================================= */

    const answerText =
        document.createElement(
            "div"
        );


    answerText.style.color =
        "#334155";


    answerText.style.lineHeight =
        "1.7";


    answerText.style.whiteSpace =
        "pre-wrap";


    answerText.style.overflowWrap =
        "anywhere";


    answerText.style.wordBreak =
        "break-word";


    /*
        IMPORTANT:

        Use textContent instead of
        innerHTML for the model response.
    */

    if (aiAnswer) {

        answerText.textContent =
            aiAnswer;

    } else {

        answerText.textContent =
            "No AI answer was generated. Your query will require faculty review.";

    }


    answerContainer.appendChild(
        heading
    );


    answerContainer.appendChild(
        answerText
    );


    /*
        Keep the answer visible inside
        the result area.
    */

    answerContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });


    console.log(
        "AI answer DOM updated successfully."
    );


    console.log(
        "Rendered text:",
        answerContainer.innerText
    );


    console.log(
        "========================================"
    );

}


/* =========================================================
   AI FEEDBACK BUTTONS
========================================================= */

function showAIFeedback(
    aiResult
) {

    const feedbackContainer =
        document.getElementById(
            "aiFeedbackContainer"
        );


    if (!feedbackContainer) {

        console.error(
            "#aiFeedbackContainer was not found."
        );

        return;

    }


    feedbackContainer.replaceChildren();


    feedbackContainer.style.display =
        "block";


    feedbackContainer.style.visibility =
        "visible";


    /* =========================================
       QUESTION
    ========================================= */

    const question =
        document.createElement(
            "div"
        );


    question.textContent =
        "Did this answer solve your query?";


    question.style.fontWeight =
        "600";


    question.style.marginBottom =
        "12px";


    question.style.color =
        "#0f172a";


    /* =========================================
       BUTTON ROW
    ========================================= */

    const buttonRow =
        document.createElement(
            "div"
        );


    buttonRow.style.display =
        "flex";


    buttonRow.style.gap =
        "10px";


    buttonRow.style.justifyContent =
        "center";


    buttonRow.style.flexWrap =
        "wrap";


    /* =========================================
       YES BUTTON
    ========================================= */

    const acceptButton =
        document.createElement(
            "button"
        );


    acceptButton.type =
        "button";


    acceptButton.id =
        "aiAcceptButton";


    acceptButton.textContent =
        "✓ Yes, this solved my query";


    acceptButton.style.padding =
        "11px 18px";


    acceptButton.style.border =
        "none";


    acceptButton.style.borderRadius =
        "8px";


    acceptButton.style.cursor =
        "pointer";


    acceptButton.style.background =
        "#16a34a";


    acceptButton.style.color =
        "white";


    acceptButton.style.fontWeight =
        "600";


    /* =========================================
       NO BUTTON
    ========================================= */

    const rejectButton =
        document.createElement(
            "button"
        );


    rejectButton.type =
        "button";


    rejectButton.id =
        "aiRejectButton";


    rejectButton.textContent =
        "No, I need faculty help";


    rejectButton.style.padding =
        "11px 18px";


    rejectButton.style.border =
        "none";


    rejectButton.style.borderRadius =
        "8px";


    rejectButton.style.cursor =
        "pointer";


    rejectButton.style.background =
        "#dc2626";


    rejectButton.style.color =
        "white";


    rejectButton.style.fontWeight =
        "600";


    /* =========================================
       ADD BUTTONS
    ========================================= */

    buttonRow.appendChild(
        acceptButton
    );


    buttonRow.appendChild(
        rejectButton
    );


    feedbackContainer.appendChild(
        question
    );


    feedbackContainer.appendChild(
        buttonRow
    );


    /* =========================================
       EVENTS
    ========================================= */

    acceptButton.addEventListener(
        "click",
        () => {

            confirmAIAnswer(
                aiResult
            );

        }
    );


    rejectButton.addEventListener(
        "click",
        () => {

            escalateToFaculty(
                aiResult
            );

        }
    );


    console.log(
        "AI feedback buttons rendered."
    );

}


/* =========================================================
   NO AI ANSWER STATE
========================================================= */

function showNoAIAnswerState(
    aiResult
) {

    const feedbackContainer =
        document.getElementById(
            "aiFeedbackContainer"
        );


    if (!feedbackContainer) {

        console.error(
            "#aiFeedbackContainer was not found."
        );

        return;

    }


    feedbackContainer.replaceChildren();


    feedbackContainer.style.display =
        "block";


    feedbackContainer.style.visibility =
        "visible";


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


    /* =========================================
       TITLE
    ========================================= */

    const title =
        document.createElement(
            "div"
        );


    title.textContent =
        "Faculty Review Required";


    title.style.fontWeight =
        "700";


    title.style.marginBottom =
        "8px";


    /* =========================================
       MESSAGE
    ========================================= */

    const message =
        document.createElement(
            "div"
        );


    message.textContent =
        "No useful resolved academic information was found. Your query needs faculty assistance.";


    message.style.lineHeight =
        "1.6";


    /* =========================================
       ESCALATION BUTTON
    ========================================= */

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.id =
        "noResultEscalateButton";


    button.textContent =
        "Forward to Faculty";


    button.style.marginTop =
        "14px";


    button.style.padding =
        "10px 18px";


    button.style.border =
        "none";


    button.style.borderRadius =
        "8px";


    button.style.background =
        "#2563eb";


    button.style.color =
        "white";


    button.style.cursor =
        "pointer";


    button.style.fontWeight =
        "600";


    feedbackContainer.appendChild(
        title
    );


    feedbackContainer.appendChild(
        message
    );


    feedbackContainer.appendChild(
        button
    );


    button.addEventListener(
        "click",
        () => {

            escalateToFaculty(
                aiResult
            );

        }
    );

}


/* =========================================================
   CONFIRM AI ANSWER
========================================================= */

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

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            queryId:
                                submittedQueryId,

                            aiAnswer:
                                aiResult?.aiAnswer ||
                                "",

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


        const result =
            await readJSON(
                response
            );


        console.log(
            "AI confirm response:",
            result
        );


        if (!response.ok) {

            throw new Error(

                result?.detail ||

                result?.message ||

                "Unable to confirm AI answer."

            );

        }


        showConfirmationMessage(
            "Your query has been resolved by AI."
        );


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


/* =========================================================
   ESCALATE TO FACULTY
========================================================= */

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


        const response =
            await fetch(
                `${AI_API_URL}/ai-escalate`,
                {

                    method:
                        "POST",

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


        const result =
            await readJSON(
                response
            );


        console.log(
            "AI escalation response:",
            result
        );


        if (!response.ok) {

            throw new Error(

                result?.detail ||

                result?.message ||

                "Unable to forward query to faculty."

            );

        }


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


/* =========================================================
   READ JSON
========================================================= */

async function readJSON(
    response
) {

    try {

        return await response.json();

    } catch {

        return {};

    }

}


/* =========================================================
   DISABLE AI FEEDBACK BUTTONS
========================================================= */

function disableAIFeedbackButtons() {

    const buttons =
        document.querySelectorAll(
            "#aiFeedbackContainer button"
        );


    buttons.forEach(
        (button) => {

            button.disabled =
                true;


            button.style.opacity =
                "0.6";


            button.style.cursor =
                "not-allowed";

        }
    );

}


/* =========================================================
   ENABLE AI FEEDBACK BUTTONS
========================================================= */

function enableAIFeedbackButtons() {

    const buttons =
        document.querySelectorAll(
            "#aiFeedbackContainer button"
        );


    buttons.forEach(
        (button) => {

            button.disabled =
                false;


            button.style.opacity =
                "1";


            button.style.cursor =
                "pointer";

        }
    );

}


/* =========================================================
   CONFIRMATION MESSAGE
========================================================= */

function showConfirmationMessage(
    message
) {

    if (!resultState) {

        return;

    }


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


        if (
            continueButton &&
            continueButton.parentNode ===
                resultState
        ) {

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


    const feedback =
        document.getElementById(
            "aiFeedbackContainer"
        );


    if (feedback) {

        feedback.remove();

    }

}


/* =========================================================
   CLOSE AI MODAL
========================================================= */

function closeAiModal() {

    if (!aiModal) {

        return;

    }


    aiModal.classList.remove(
        "show"
    );


    [

        "aiAnswerContainer",

        "aiFeedbackContainer",

        "aiConfirmationMessage"

    ].forEach(
        (id) => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.remove();

            }

        }
    );

}


/* =========================================================
   CONTINUE BUTTON
========================================================= */

if (continueButton) {

    continueButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "my-queries.html";

        }
    );

}


/* =========================================================
   MODAL CLOSE
========================================================= */

if (aiModal) {

    aiModal.addEventListener(
        "click",
        (event) => {

            /*
                Allow closing only after
                processing has finished.
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


/* =========================================================
   DELAY
========================================================= */

function delay(
    milliseconds
) {

    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    alert(
        message
    );

}


/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

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


/* =========================================================
   PROFILE MENU
========================================================= */

if (
    profileButton &&
    profileMenu
) {

    profileButton.addEventListener(
        "click",
        (event) => {

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
        (event) => {

            event.stopPropagation();

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

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


/* =========================================================
   LOGOUT
========================================================= */

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