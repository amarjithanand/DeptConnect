/* =========================================
   ELEMENTS
========================================= */

const notificationCards =
    document.querySelectorAll(
        ".notification-card"
    );

const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const unreadCountElement =
    document.getElementById(
        "unreadCount"
    );

const filterUnreadCount =
    document.getElementById(
        "filterUnreadCount"
    );

const allCount =
    document.getElementById(
        "allCount"
    );

const navNotificationDot =
    document.getElementById(
        "navNotificationDot"
    );


/* =========================================
   UPDATE COUNTS
========================================= */

function updateCounts() {

    let unread = 0;
    let total = 0;


    notificationCards.forEach(card => {

        total++;


        if (
            card.dataset.read === "false"
        ) {

            unread++;

        }

    });


    unreadCountElement.textContent =
        unread;

    filterUnreadCount.textContent =
        unread;

    allCount.textContent =
        total;


    navNotificationDot.style.display =
        unread > 0
            ? "block"
            : "none";

}


/* =========================================
   FILTER
========================================= */

function applyFilter(filter) {

    let visible = 0;


    notificationCards.forEach(card => {

        const type =
            card.dataset.type;

        const isUnread =
            card.dataset.read === "false";


        let shouldShow = true;


        if (filter === "unread") {

            shouldShow = isUnread;

        }


        else if (
            filter === "query"
        ) {

            shouldShow =
                type === "query";

        }


        else if (
            filter === "system"
        ) {

            shouldShow =
                type === "system";

        }


        else if (
            filter === "knowledge"
        ) {

            shouldShow =
                type === "knowledge";

        }


        card.style.display =
            shouldShow
                ? "flex"
                : "none";


        if (shouldShow) {

            visible++;

        }

    });


    emptyState.classList.toggle(
        "show",
        visible === 0
    );

}


/* =========================================
   FILTER BUTTONS
========================================= */

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            applyFilter(
                button.dataset.filter
            );

        }
    );

});


/* =========================================
   MARK SINGLE NOTIFICATION AS READ
========================================= */

notificationCards.forEach(card => {

    const readButton =
        card.querySelector(
            '[data-action="read"]'
        );


    if (!readButton) {
        return;
    }


    readButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            markAsRead(card);

        }
    );

});


function markAsRead(card) {

    card.dataset.read =
        "true";


    card.classList.remove(
        "unread"
    );


    const dot =
        card.querySelector(
            ".unread-dot"
        );


    if (dot) {

        dot.remove();

    }


    const readButton =
        card.querySelector(
            '[data-action="read"]'
        );


    if (readButton) {

        readButton.remove();

    }


    updateCounts();


    /*
        Later:

        API call →

        PATCH /notifications/:id/read

    */

}


/* =========================================
   MARK ALL AS READ
========================================= */

document
    .getElementById(
        "markAllButton"
    )
    .addEventListener(
        "click",
        () => {

            notificationCards.forEach(
                card => {

                    if (
                        card.dataset.read ===
                        "false"
                    ) {

                        markAsRead(card);

                    }

                }
            );


            updateCounts();

        }
    );


/* =========================================
   NOTIFICATION ACTIONS
========================================= */

notificationCards.forEach(card => {

    const buttons =
        card.querySelectorAll(
            "[data-action]"
        );


    buttons.forEach(button => {

        if (
            button.dataset.action ===
            "read"
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const action =
                    button.dataset.action;


                /*
                    Query-related notifications
                    will eventually open the
                    corresponding query.

                    For now they navigate to
                    My Queries.
                */

                if (
                    action === "query" ||
                    action === "solution"
                ) {

                    window.location.href =
                        "my-queries.html";

                    return;

                }


                if (
                    action === "knowledge"
                ) {

                    window.location.href =
                        "knowledge-base.html";

                    return;

                }


                if (
                    action === "announcement"
                ) {

                    alert(
                        "Announcement details will be loaded from the notification service."
                    );

                }

            }
        );

    });

});


/* =========================================
   CLICK NOTIFICATION CARD
========================================= */

notificationCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            /*
                Clicking an unread notification
                marks it as read.
            */

            if (
                card.dataset.read ===
                "false"
            ) {

                markAsRead(card);

            }

        }
    );

});


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
   INITIALIZE
========================================= */

updateCounts();

applyFilter("all");