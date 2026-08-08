/* =========================================
   STUDENT DATA
========================================= */

const studentName = "Amarjith";

const studentEmail =
    sessionStorage.getItem("deptconnect_student_email");


/* =========================================
   LOGIN PROTECTION
========================================= */

const isLoggedIn =
    sessionStorage.getItem("deptconnect_logged_in");


// During actual development, uncomment this.
// For now it is kept disabled so you can
// directly open dashboard.html while designing.

/*
if (isLoggedIn !== "true") {

    window.location.href = "login.html";

}
*/


/* =========================================
   DISPLAY STUDENT NAME
========================================= */

const studentNameElement =
    document.getElementById("studentName");

const menuStudentName =
    document.getElementById("menuStudentName");


if (studentNameElement) {

    studentNameElement.textContent =
        studentName;

}


if (menuStudentName) {

    menuStudentName.textContent =
        studentName;

}


/* =========================================
   PROFILE DROPDOWN
========================================= */

const profileButton =
    document.getElementById("profileButton");

const profileMenu =
    document.getElementById("profileMenu");


profileButton.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        profileMenu.classList.toggle("show");

    }
);


/* Close dropdown when clicking outside */

document.addEventListener(
    "click",
    () => {

        profileMenu.classList.remove("show");

    }
);


/* Prevent menu click from closing */

profileMenu.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

    }
);


/* =========================================
   NOTIFICATIONS
========================================= */

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


notificationButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "notifications.html";

    }
);


/* =========================================
   QUICK KNOWLEDGE BASE SEARCH
========================================= */

const knowledgeSearch =
    document.getElementById(
        "knowledgeSearch"
    );


knowledgeSearch.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            const query =
                knowledgeSearch.value.trim();


            if (!query) {

                return;

            }


            /*
                Store search term temporarily.

                Knowledge Base page will read
                this value later.
            */

            sessionStorage.setItem(
                "knowledge_search",
                query
            );


            window.location.href =
                "knowledge-base.html";

        }

    }
);


/* =========================================
   RECENT QUERY CLICK
========================================= */

const queryItems =
    document.querySelectorAll(
        ".query-item"
    );


queryItems.forEach(
    (item) => {

        item.addEventListener(
            "click",
            () => {

                const queryId =
                    item.dataset.queryId;


                /*
                    Store selected query.

                    Query Details popup/page
                    can use this later.
                */

                sessionStorage.setItem(
                    "selected_query_id",
                    queryId
                );


                window.location.href =
                    "my-queries.html";

            }
        );

    }
);


/* =========================================
   LOGOUT
========================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


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


        /*
            Clear student session.
        */

        sessionStorage.removeItem(
            "deptconnect_logged_in"
        );

        sessionStorage.removeItem(
            "deptconnect_student_email"
        );

        sessionStorage.removeItem(
            "selected_query_id"
        );

        sessionStorage.removeItem(
            "knowledge_search"
        );


        /*
            Return to login.
        */

        window.location.href =
            "login.html";

    }
);