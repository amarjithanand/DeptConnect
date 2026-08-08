/* =========================================
   ELEMENTS
========================================= */

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const categoryCards =
    document.querySelectorAll(
        ".category-card"
    );

const articleCards =
    document.querySelectorAll(
        ".article-card"
    );

const articleGrid =
    document.getElementById("articleGrid");

const articleCount =
    document.getElementById("articleCount");

const noResults =
    document.getElementById("noResults");

const sortSelect =
    document.getElementById("sortSelect");


/* =========================================
   SEARCH
========================================= */

function filterArticles() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const activeCategory =
        document
            .querySelector(
                ".category-card.active"
            )
            .dataset.category;


    let visibleCount = 0;


    articleCards.forEach(card => {

        const title =
            card.dataset.title
                .toLowerCase();

        const keywords =
            card.dataset.keywords
                .toLowerCase();

        const category =
            card.dataset.category;


        const matchesSearch =
            !search ||
            title.includes(search) ||
            keywords.includes(search);


        const matchesCategory =
            activeCategory === "all" ||
            category === activeCategory;


        const visible =
            matchesSearch &&
            matchesCategory;


        card.style.display =
            visible ? "flex" : "none";


        if (visible) {

            visibleCount++;

        }

    });


    articleCount.textContent =
        search
            ? `${visibleCount} result${
                visibleCount === 1
                    ? ""
                    : "s"
              } found`
            : "Frequently accessed information";


    noResults.style.display =
        visibleCount === 0
            ? "block"
            : "none";

}


/* =========================================
   SEARCH BUTTON
========================================= */

searchButton.addEventListener(
    "click",
    filterArticles
);


/* Search on Enter */

searchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            filterArticles();

        }

    }
);


/* =========================================
   CATEGORY FILTER
========================================= */

categoryCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            categoryCards.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            card.classList.add("active");


            filterArticles();

        }
    );

});


/* =========================================
   SEARCH HINTS
========================================= */

document
    .querySelectorAll(
        ".search-hints button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                searchInput.value =
                    button.dataset.search;

                filterArticles();

                searchInput.focus();

            }
        );

    });


/* =========================================
   SORT
========================================= */

sortSelect.addEventListener(
    "change",
    () => {

        const cards =
            Array.from(
                articleCards
            );


        if (
            sortSelect.value === "az"
        ) {

            cards.sort(
                (a, b) =>
                    a.dataset.title
                        .localeCompare(
                            b.dataset.title
                        )
            );

        }


        if (
            sortSelect.value === "popular"
        ) {

            cards.sort(
                (a, b) =>
                    Number(
                        b.dataset.popularity
                    ) -
                    Number(
                        a.dataset.popularity
                    )
            );

        }


        if (
            sortSelect.value === "recent"
        ) {

            /*
                Demo order.

                Backend will eventually provide
                updatedAt and sorting can happen
                using actual dates.
            */

            cards.sort(
                (a, b) =>
                    Number(
                        b.dataset.popularity
                    ) -
                    Number(
                        a.dataset.popularity
                    )
            );

        }


        cards.forEach(card => {

            articleGrid.appendChild(card);

        });

    }
);


/* =========================================
   ARTICLE CONTENT
========================================= */

const articleContent = {

    "How to Register for Semester Exams": {

        category: "ACADEMICS",

        content: `
            <h3>Overview</h3>

            <p>
                Students can complete semester examination
                registration through the designated academic
                registration process.
            </p>

            <h3>Registration Process</h3>

            <ol>
                <li>
                    Check the examination notification
                    and registration dates.
                </li>

                <li>
                    Verify your registered courses.
                </li>

                <li>
                    Complete the examination registration form.
                </li>

                <li>
                    Verify the details before submitting.
                </li>

                <li>
                    Save the confirmation for future reference.
                </li>
            </ol>
        `

    },


    "Project Submission Guidelines": {

        category: "COMPUTER SCIENCE",

        content: `
            <h3>Overview</h3>

            <p>
                Academic projects should follow the project
                guidelines provided by the concerned department.
            </p>

            <h3>Before Submission</h3>

            <ol>
                <li>Check the required project format.</li>
                <li>Complete the required documentation.</li>
                <li>Verify the submission deadline.</li>
                <li>Submit through the designated channel.</li>
            </ol>
        `

    },


    "Attendance Requirements": {

        category: "ACADEMICS",

        content: `
            <h3>Overview</h3>

            <p>
                Students should maintain the attendance level
                required by their institution and academic program.
            </p>

            <h3>Attendance Shortage</h3>

            <p>
                Students facing attendance-related issues should
                contact the concerned academic authority for the
                applicable procedure.
            </p>
        `

    },


    "Add or Drop a Course": {

        category: "REGISTRAR",

        content: `
            <h3>Overview</h3>

            <p>
                Course additions and withdrawals are subject to
                the academic calendar and institutional regulations.
            </p>

            <h3>Procedure</h3>

            <ol>
                <li>Check the applicable registration period.</li>
                <li>Verify course availability.</li>
                <li>Submit the required request.</li>
                <li>Confirm the updated registration.</li>
            </ol>
        `

    },


    "Student Leave Application": {

        category: "STUDENT SERVICES",

        content: `
            <h3>Overview</h3>

            <p>
                Students can submit leave requests through the
                applicable institutional process.
            </p>

            <h3>Application</h3>

            <p>
                Include the required dates, reason and supporting
                documentation where applicable.
            </p>
        `

    },


    "Laboratory Record Submission": {

        category: "COMPUTER SCIENCE",

        content: `
            <h3>Overview</h3>

            <p>
                Laboratory records should be prepared according
                to the requirements of the concerned course.
            </p>

            <h3>Submission</h3>

            <ol>
                <li>Complete the required experiments.</li>
                <li>Verify record entries.</li>
                <li>Obtain required verification.</li>
                <li>Submit before the specified deadline.</li>
            </ol>
        `

    }

};


/* =========================================
   ARTICLE MODAL
========================================= */

const articleModal =
    document.getElementById(
        "articleModal"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const modalContent =
    document.getElementById(
        "modalContent"
    );

const modalCategory =
    document.querySelector(
        ".modal-category"
    );


articleCards.forEach(card => {

    card.addEventListener(
        "click",
        event => {

            /*
                Ignore if the card later
                contains a button/link.
            */

            const title =
                card.dataset.title;


            const article =
                articleContent[title];


            modalTitle.textContent =
                title;


            if (article) {

                modalCategory.textContent =
                    article.category;

                modalContent.innerHTML =
                    article.content +
                    `
                    <div class="source-note">

                        <strong>
                            Source
                        </strong>

                        <span>
                            Institutional Knowledge Base
                        </span>

                    </div>
                    `;

            }


            articleModal.classList.add(
                "show"
            );

            document.body.style.overflow =
                "hidden";

        }
    );

});


/* =========================================
   CLOSE MODAL
========================================= */

function closeArticleModal() {

    articleModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

}


document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeArticleModal
    );


articleModal.addEventListener(
    "click",
    event => {

        if (
            event.target === articleModal
        ) {

            closeArticleModal();

        }

    }
);


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeArticleModal();

        }

    }
);


/* =========================================
   ARTICLE FEEDBACK
========================================= */

const feedbackButtons =
    document.querySelectorAll(
        ".feedback-button"
    );

const feedbackMessage =
    document.getElementById(
        "feedbackMessage"
    );


feedbackButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            feedbackButtons.forEach(
                item => {

                    item.classList.remove(
                        "selected"
                    );

                }
            );


            button.classList.add(
                "selected"
            );


            if (
                button.dataset.feedback ===
                "yes"
            ) {

                feedbackMessage.textContent =
                    "Thanks! Your feedback helps improve the Knowledge Base.";

            } else {

                feedbackMessage.textContent =
                    "Thanks. You can ask a query if you still need help.";

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
   READ DASHBOARD SEARCH
========================================= */

const savedSearch =
    sessionStorage.getItem(
        "knowledge_search"
    );


if (savedSearch) {

    searchInput.value =
        savedSearch;

    sessionStorage.removeItem(
        "knowledge_search"
    );

    filterArticles();

}