/* =========================================
   SETTINGS NAVIGATION
========================================= */

const settingsNav =
    document.querySelectorAll(
        ".settings-nav"
    );

const settingsPanels =
    document.querySelectorAll(
        ".settings-panel"
    );


settingsNav.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const target =
                button.dataset.target;


            settingsNav.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            settingsPanels.forEach(
                panel => {

                    panel.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            document
                .getElementById(target)
                .classList.add("active");


            /*
                Save currently selected
                settings section.
            */

            localStorage.setItem(
                "deptconnect_settings_section",
                target
            );

        }
    );

});


/* =========================================
   SAVE SETTINGS
========================================= */

const saveButtons =
    document.querySelectorAll(
        "[data-save]"
    );


saveButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const section =
                button.dataset.save;


            saveSettings(
                section
            );


            showToast(
                "Settings saved successfully"
            );

        }
    );

});


function saveSettings(section) {

    if (
        section ===
        "notifications"
    ) {

        const preferences = {

            query:
                document.getElementById(
                    "queryNotifications"
                ).checked,

            ai:
                document.getElementById(
                    "aiNotifications"
                ).checked,

            faculty:
                document.getElementById(
                    "facultyNotifications"
                ).checked,

            knowledge:
                document.getElementById(
                    "knowledgeNotifications"
                ).checked

        };


        localStorage.setItem(
            "deptconnect_notifications",
            JSON.stringify(
                preferences
            )
        );

    }


    if (
        section ===
        "query"
    ) {

        const preferences = {

            aiProcessing:
                document.getElementById(
                    "aiProcessing"
                ).checked,

            similarArticles:
                document.getElementById(
                    "similarArticles"
                ).checked,

            confirmation:
                document.getElementById(
                    "queryConfirmation"
                ).checked

        };


        localStorage.setItem(
            "deptconnect_query_preferences",
            JSON.stringify(
                preferences
            )
        );

    }


    if (
        section ===
        "appearance"
    ) {

        const preferences = {

            density:
                document.getElementById(
                    "densitySelect"
                ).value,

            reduceAnimations:
                document.getElementById(
                    "reduceAnimations"
                ).checked

        };


        localStorage.setItem(
            "deptconnect_appearance",
            JSON.stringify(
                preferences
            )
        );

    }

}


/* =========================================
   LOAD SETTINGS
========================================= */

function loadSettings() {


    /* -------------------------------
       Notifications
    -------------------------------- */

    const notificationSettings =
        localStorage.getItem(
            "deptconnect_notifications"
        );


    if (notificationSettings) {

        const preferences =
            JSON.parse(
                notificationSettings
            );


        document.getElementById(
            "queryNotifications"
        ).checked =
            preferences.query;


        document.getElementById(
            "aiNotifications"
        ).checked =
            preferences.ai;


        document.getElementById(
            "facultyNotifications"
        ).checked =
            preferences.faculty;


        document.getElementById(
            "knowledgeNotifications"
        ).checked =
            preferences.knowledge;

    }


    /* -------------------------------
       Query Preferences
    -------------------------------- */

    const querySettings =
        localStorage.getItem(
            "deptconnect_query_preferences"
        );


    if (querySettings) {

        const preferences =
            JSON.parse(
                querySettings
            );


        document.getElementById(
            "aiProcessing"
        ).checked =
            preferences.aiProcessing;


        document.getElementById(
            "similarArticles"
        ).checked =
            preferences.similarArticles;


        document.getElementById(
            "queryConfirmation"
        ).checked =
            preferences.confirmation;

    }


    /* -------------------------------
       Appearance
    -------------------------------- */

    const appearanceSettings =
        localStorage.getItem(
            "deptconnect_appearance"
        );


    if (appearanceSettings) {

        const preferences =
            JSON.parse(
                appearanceSettings
            );


        document.getElementById(
            "densitySelect"
        ).value =
            preferences.density;


        document.getElementById(
            "reduceAnimations"
        ).checked =
            preferences.reduceAnimations;

    }


    /* -------------------------------
       Last opened section
    -------------------------------- */

    const savedSection =
        localStorage.getItem(
            "deptconnect_settings_section"
        );


    if (savedSection) {

        const button =
            document.querySelector(
                `[data-target="${savedSection}"]`
            );


        if (button) {

            button.click();

        }

    }

}


loadSettings();


/* =========================================
   TOAST
========================================= */

const toast =
    document.getElementById(
        "toast"
    );

let toastTimer;


function showToast(message) {

    toast.textContent =
        "✓ " + message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
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
   PROFILE MENU
========================================= */

const profileButton =
    document.getElementById(
        "profileButton"
    );

const profileMenu =
    document.getElementById(
        "profileMenu"
    );


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


/* =========================================
   LOAD PROFILE PHOTO
========================================= */

const savedPhoto =
    localStorage.getItem(
        "deptconnect_profile_photo"
    );


if (savedPhoto) {

    const navAvatar =
        document.getElementById(
            "navAvatar"
        );


    navAvatar.innerHTML = "";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        savedPhoto;

    image.alt =
        "Profile";


    navAvatar.appendChild(
        image
    );

}


/* =========================================
   NOTIFICATIONS
========================================= */

document
    .getElementById(
        "notificationButton"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "notifications.html";

        }
    );


/* =========================================
   HELP ACTIONS
========================================= */

document
    .getElementById(
        "reportProblemButton"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "ask-query.html";

        }
    );


document
    .getElementById(
        "contactSupportButton"
    )
    .addEventListener(
        "click",
        () => {

            alert(
                "Support contact details will be connected here."
            );

        }
    );


/* =========================================
   LOGOUT
========================================= */

function logout() {

    if (
        confirm(
            "Are you sure you want to logout?"
        )
    ) {

        sessionStorage.clear();

        window.location.href =
            "login.html";

    }

}


document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        logout
    );


document
    .getElementById(
        "logoutMenuButton"
    )
    .addEventListener(
        "click",
        logout
    );


/* =========================================
   REDUCE ANIMATIONS
========================================= */

document
    .getElementById(
        "reduceAnimations"
    )
    .addEventListener(
        "change",
        event => {

            document.body.classList.toggle(
                "reduce-motion",
                event.target.checked
            );

        }
    );