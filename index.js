/* =========================================
   ELEMENTS
========================================= */

const splashScreen =
    document.getElementById(
        "splashScreen"
    );

const roleScreen =
    document.getElementById(
        "roleScreen"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const progressText =
    document.getElementById(
        "progressText"
    );

const loadingText =
    document.getElementById(
        "loadingText"
    );


/* =========================================
   SPLASH CONFIGURATION
========================================= */

const totalDuration = 3000;

const startTime = performance.now();


const loadingMessages = [

    {
        percent: 0,
        text: "Initializing..."
    },

    {
        percent: 20,
        text: "Loading DeptConnect..."
    },

    {
        percent: 45,
        text: "Preparing workspace..."
    },

    {
        percent: 70,
        text: "Initializing services..."
    },

    {
        percent: 90,
        text: "Almost ready..."
    },

    {
        percent: 100,
        text: "Welcome to DeptConnect"
    }

];


/* =========================================
   UPDATE LOADING MESSAGE
========================================= */

function updateLoadingMessage(
    percentage
) {

    let currentMessage =
        loadingMessages[0];


    loadingMessages.forEach(
        message => {

            if (
                percentage >=
                message.percent
            ) {

                currentMessage =
                    message;

            }

        }
    );


    loadingText.textContent =
        currentMessage.text;

}


/* =========================================
   PROGRESS ANIMATION
========================================= */

function animateSplash(
    currentTime
) {

    const elapsed =
        currentTime - startTime;


    let percentage =
        (elapsed / totalDuration) * 100;


    percentage =
        Math.min(
            percentage,
            100
        );


    /*
        Slightly smooth the beginning
        and ending of the animation.
    */

    const circumference =
        2 * Math.PI * 42;


    const offset =
        circumference -
        (
            percentage /
            100
        ) *
        circumference;


    progressBar.style.strokeDashoffset =
        offset;


    progressText.textContent =
        `${Math.floor(percentage)}%`;


    updateLoadingMessage(
        percentage
    );


    if (
        percentage < 100
    ) {

        requestAnimationFrame(
            animateSplash
        );

    } else {

        finishSplash();

    }

}


requestAnimationFrame(
    animateSplash
);


/* =========================================
   FINISH SPLASH
========================================= */

function finishSplash() {

    setTimeout(
        () => {

            splashScreen.classList.add(
                "hide"
            );


            roleScreen.classList.add(
                "show"
            );


            /*
                Remove splash from
                interaction after animation.
            */

            setTimeout(
                () => {

                    splashScreen.style.display =
                        "none";

                },
                750
            );

        },
        350
    );

}


/* =========================================
   STUDENT
========================================= */

document
    .getElementById(
        "studentButton"
    )
    .addEventListener(
        "click",
        () => {

            /*
                Small interaction delay
                gives the card click
                feedback before navigation.
            */

            document
                .getElementById(
                    "studentButton"
                )
                .classList.add(
                    "selected"
                );


            setTimeout(
                () => {

                    window.location.href =
                        "Student/login.html";

                },
                150
            );

        }
    );


/* =========================================
   TEACHER
========================================= */

document
    .getElementById(
        "teacherButton"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "teacherButton"
                )
                .classList.add(
                    "selected"
                );


            setTimeout(
                () => {

                    window.location.href =
                        "Faculty/login.html";

                },
                150
            );

        }
    );