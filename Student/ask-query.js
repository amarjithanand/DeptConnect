/* =========================================
   ELEMENTS
========================================= */

const queryForm =
    document.getElementById("queryForm");

const description =
    document.getElementById("description");

const characterCount =
    document.getElementById("characterCount");

const attachment =
    document.getElementById("attachment");

const fileName =
    document.getElementById("fileName");

const aiModal =
    document.getElementById("aiModal");

const processingState =
    document.getElementById("processingState");

const resultState =
    document.getElementById("resultState");

const continueButton =
    document.getElementById("continueButton");

const profileButton =
    document.getElementById("profileButton");

const profileMenu =
    document.getElementById("profileMenu");

const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/* =========================================
   CHARACTER COUNTER
========================================= */

description.addEventListener(
    "input",
    () => {

        const length =
            description.value.length;

        characterCount.textContent =
            `${length} / 1500`;

    }
);


/* =========================================
   FILE UPLOAD
========================================= */

attachment.addEventListener(
    "change",
    () => {

        const file =
            attachment.files[0];


        if (!file) {

            fileName.textContent = "";

            return;

        }


        const maxSize =
            5 * 1024 * 1024;


        if (file.size > maxSize) {

            alert(
                "File size must be less than 5 MB."
            );

            attachment.value = "";

            fileName.textContent = "";

            return;

        }


        fileName.textContent =
            `Selected: ${file.name}`;

    }
);


/* =========================================
   FORM SUBMISSION
========================================= */

queryForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /* Collect data */

        const department =
            document.getElementById(
                "department"
            ).value;

        const subject =
            document.getElementById(
                "subject"
            ).value.trim();

        const title =
            document.getElementById(
                "queryTitle"
            ).value.trim();

        const query =
            description.value.trim();


        /* Basic validation */

        if (
            !department ||
            !subject ||
            !title ||
            !query
        ) {

            alert(
                "Please complete all required fields."
            );

            return;

        }


        /*
            Create query object.

            This will eventually be sent
            to your backend API.
        */

        const queryData = {

            department: department,

            subject: subject,

            title: title,

            description: query,

            priority:
                document.querySelector(
                    'input[name="priority"]:checked'
                ).value,

            submittedAt:
                new Date().toISOString()

        };


        /*
            Temporarily store query.

            Later this becomes an API call.
        */

        sessionStorage.setItem(
            "pending_query",
            JSON.stringify(queryData)
        );


        /* Open AI modal */

        openAIModal();


        /* Start simulated processing */

        await processQuery();

    }
);


/* =========================================
   OPEN AI MODAL
========================================= */

function openAIModal() {

    aiModal.classList.add("show");

    processingState.style.display =
        "block";

    resultState.style.display =
        "none";


    resetProcessingSteps();

}


/* =========================================
   RESET STEPS
========================================= */

function resetProcessingSteps() {

    for (let i = 1; i <= 4; i++) {

        const step =
            document.getElementById(
                `step${i}`
            );

        step.classList.remove(
            "active",
            "completed"
        );

        step.querySelector(
            ".step-icon"
        ).textContent = "○";

    }

}


/* =========================================
   PROCESS QUERY
========================================= */

async function processQuery() {

    /*
        STEP 1
    */

    await processStep(
        "step1",
        1000
    );


    /*
        STEP 2
    */

    await processStep(
        "step2",
        1200
    );


    /*
        STEP 3
    */

    await processStep(
        "step3",
        1000
    );


    /*
        STEP 4
    */

    await processStep(
        "step4",
        1200
    );


    /*
        Show result
    */

    showResult();

}


/* =========================================
   PROCESS INDIVIDUAL STEP
========================================= */

function processStep(
    stepId,
    duration
) {

    return new Promise(
        (resolve) => {

            const step =
                document.getElementById(
                    stepId
                );

            const icon =
                step.querySelector(
                    ".step-icon"
                );


            step.classList.add("active");

            icon.textContent = "◌";


            setTimeout(
                () => {

                    step.classList.remove(
                        "active"
                    );

                    step.classList.add(
                        "completed"
                    );

                    icon.textContent = "✓";


                    resolve();

                },
                duration
            );

        }
    );

}


/* =========================================
   SHOW RESULT
========================================= */

function showResult() {

    processingState.style.display =
        "none";

    resultState.style.display =
        "block";


    /*
        DEMO RESULT

        Later these values will come
        from your AI service.
    */

    const queryData =
        JSON.parse(
            sessionStorage.getItem(
                "pending_query"
            )
        );


    document.getElementById(
        "resultCategory"
    ).textContent =
        queryData.subject;


    document.getElementById(
        "resultSimilarity"
    ).textContent =
        "No duplicate found";


    document.getElementById(
        "resultNextStep"
    ).textContent =
        "Forwarded to Department";

}


/* =========================================
   CONTINUE
========================================= */

continueButton.addEventListener(
    "click",
    () => {

        /*
            Eventually this should navigate
            to My Queries with the newly
            created query.
        */

        window.location.href =
            "my-queries.html";

    }
);


/* =========================================
   PROFILE MENU
========================================= */

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


/* =========================================
   NOTIFICATIONS
========================================= */

notificationButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "notifications.html";

    }
);


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
    "click",
    () => {

        const confirmLogout =
            confirm(
                "Are you sure you want to logout?"
            );


        if (!confirmLogout) {

            return;

        }


        sessionStorage.clear();

        window.location.href =
            "login.html";

    }
);