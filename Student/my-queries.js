/* =========================================
   QUERY DATA
========================================= */

const queryData = {

    1: {
        id: "001",
        status: "AWAITING FACULTY",
        title: "Clarification on Project 2 Requirements",
        department: "Computer Science",
        subject: "CS101",
        date: "Today, 10:30 AM",
        priority: "Normal",
        description:
            "I need clarification regarding the requirements and submission format for Project 2.",
        type: "pending"
    },

    2: {
        id: "002",
        status: "AI RESOLVED",
        title: "Deadline for Add/Drop Period",
        department: "Registrar",
        subject: "Academic Calendar",
        date: "Yesterday, 11:20 AM",
        priority: "Normal",
        description:
            "What is the final date for adding or dropping a course this semester?",
        type: "ai-resolved"
    },

    3: {
        id: "003",
        status: "IN PROGRESS",
        title: "Request for Course Override",
        department: "Advising",
        subject: "Advanced Machine Learning",
        date: "2 days ago",
        priority: "High",
        description:
            "I would like to request an override for Advanced Machine Learning due to a timetable conflict.",
        type: "in-progress"
    }

};


/* =========================================
   ELEMENTS
========================================= */

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const departmentFilter =
    document.getElementById("departmentFilter");

const dateFilter =
    document.getElementById("dateFilter");

const sortFilter =
    document.getElementById("sortFilter");

const clearFilters =
    document.getElementById("clearFilters");

const queryCards =
    document.querySelectorAll(".query-card");

const resultCount =
    document.getElementById("resultCount");

const noResults =
    document.getElementById("noResults");


/* =========================================
   FILTER FUNCTION
========================================= */

function filterQueries() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        statusFilter.value;

    const department =
        departmentFilter.value;


    let visibleCount = 0;


    queryCards.forEach(card => {

        const title =
            card.dataset.title
                .toLowerCase();

        const cardStatus =
            card.dataset.status;

        const cardDepartment =
            card.dataset.department;


        const matchesSearch =
            !search ||
            title.includes(search);


        const matchesStatus =
            status === "all" ||
            cardStatus === status;


        const matchesDepartment =
            department === "all" ||
            cardDepartment === department;


        const visible =
            matchesSearch &&
            matchesStatus &&
            matchesDepartment;


        card.style.display =
            visible ? "block" : "none";


        if (visible) {

            visibleCount++;

        }

    });


    resultCount.textContent =
        `Showing ${visibleCount} ${
            visibleCount === 1
                ? "query"
                : "queries"
        }`;


    noResults.style.display =
        visibleCount === 0
            ? "block"
            : "none";

}


/* =========================================
   FILTER EVENTS
========================================= */

searchInput.addEventListener(
    "input",
    filterQueries
);

statusFilter.addEventListener(
    "change",
    filterQueries
);

departmentFilter.addEventListener(
    "change",
    filterQueries
);

dateFilter.addEventListener(
    "change",
    filterQueries
);


/* =========================================
   CLEAR FILTERS
========================================= */

clearFilters.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        statusFilter.value = "all";

        departmentFilter.value = "all";

        dateFilter.value = "all";

        sortFilter.value = "recent";

        filterQueries();

    }
);


/* =========================================
   SORT
========================================= */

sortFilter.addEventListener(
    "change",
    () => {

        const queryList =
            document.getElementById(
                "queryList"
            );

        const cards =
            Array.from(
                queryList.querySelectorAll(
                    ".query-card"
                )
            );


        if (
            sortFilter.value === "oldest"
        ) {

            cards.reverse();

        }


        cards.forEach(card => {

            queryList.appendChild(card);

        });

    }
);


/* =========================================
   OPEN DETAILS
========================================= */

function openDetails(id) {

    const data =
        queryData[id];

    if (!data) {
        return;
    }


    document.getElementById(
        "detailsStatus"
    ).textContent =
        data.status;


    document.getElementById(
        "detailsId"
    ).textContent =
        `Query #${data.id}`;


    document.getElementById(
        "detailsTitle"
    ).textContent =
        data.title;


    document.getElementById(
        "detailsDepartment"
    ).textContent =
        data.department;


    document.getElementById(
        "detailsSubject"
    ).textContent =
        data.subject;


    document.getElementById(
        "detailsDate"
    ).textContent =
        data.date;


    document.getElementById(
        "detailsPriority"
    ).textContent =
        data.priority;


    document.getElementById(
        "detailsDescription"
    ).textContent =
        data.description;


    document.getElementById(
        "detailsModal"
    ).classList.add("show");

}


/* =========================================
   OPEN SOLUTION
========================================= */

function openSolution(id) {

    const data =
        queryData[id];

    if (!data) {
        return;
    }


    document.getElementById(
        "solutionQuestion"
    ).textContent =
        data.title;


    document.getElementById(
        "solutionModal"
    ).classList.add("show");

}


/* =========================================
   QUERY CARD ACTIONS
========================================= */

queryCards.forEach(card => {

    card.addEventListener(
        "click",
        event => {

            const id =
                card.dataset.id;


            const actionButton =
                event.target.closest(
                    "button"
                );


            if (actionButton) {

                const action =
                    actionButton.dataset.action;


                if (action === "details") {

                    openDetails(id);

                }


                if (action === "solution") {

                    openSolution(id);

                }


                return;

            }


            openDetails(id);

        }
    );

});


/* =========================================
   CLOSE MODALS
========================================= */

document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const modalId =
                    button.dataset.close;

                document
                    .getElementById(modalId)
                    .classList.remove(
                        "show"
                    );

            }
        );

    });


/* Close by clicking overlay */

document
    .querySelectorAll(
        ".modal-overlay"
    )
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    overlay.classList.remove(
                        "show"
                    );

                }

            }
        );

    });


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        document
            .querySelectorAll(
                ".modal-overlay.show"
            )
            .forEach(modal => {

                modal.classList.remove(
                    "show"
                );

            });

    }
);


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
   LOGOUT
========================================= */

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        () => {

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
    );


/* =========================================
   INITIAL FILTER
========================================= */

filterQueries();