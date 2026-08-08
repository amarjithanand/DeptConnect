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

const searchInput =
    document.getElementById(
        "searchInput"
    );

const searchButton =
    document.getElementById(
        "searchButton"
    );

const categoryCards =
    document.querySelectorAll(
        ".category-card"
    );

const articleGrid =
    document.getElementById(
        "articleGrid"
    );

const articleCount =
    document.getElementById(
        "articleCount"
    );

const noResults =
    document.getElementById(
        "noResults"
    );

const sortSelect =
    document.getElementById(
        "sortSelect"
    );


/* =========================================
   MODAL ELEMENTS
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


/* =========================================
   GLOBAL DATA
========================================= */

let knowledgeArticles = [];

let currentUser = null;


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


        currentUser =
            user;


        console.log(
            "Authenticated UID:",
            user.uid
        );


        await loadKnowledgeBase();

    }
);


/* =========================================
   LOAD KNOWLEDGE BASE
========================================= */

async function loadKnowledgeBase() {

    try {

        console.log(
            "Loading Knowledge Base..."
        );


        /*
         * Only queries explicitly marked
         * as Knowledge Base entries are fetched.
         */

        const knowledgeQuery =
            query(
                collection(
                    db,
                    "queries"
                ),
                where(
                    "isKnowledgeBase",
                    "==",
                    true
                )
            );


        const snapshot =
            await getDocs(
                knowledgeQuery
            );


        console.log(
            "Knowledge Base entries:",
            snapshot.size
        );


        knowledgeArticles = [];


        snapshot.forEach(
            document => {

                const data =
                    document.data();


                knowledgeArticles.push({

                    id:
                        document.id,

                    ...data

                });

            }
        );


        /*
         * Newest first initially.
         */

        knowledgeArticles.sort(
            (a, b) =>
                getTimestamp(
                    b.updatedAt ||
                    b.resolvedAt ||
                    b.createdAt
                )
                -
                getTimestamp(
                    a.updatedAt ||
                    a.resolvedAt ||
                    a.createdAt
                )
        );


        renderArticles();


        updateCategoryCounts();


    } catch (error) {

        console.error(
            "Error loading Knowledge Base:",
            error
        );


        articleGrid.innerHTML =
            "";


        noResults.style.display =
            "block";


        articleCount.textContent =
            "Unable to load Knowledge Base";

    }

}


/* =========================================
   RENDER ARTICLES
========================================= */

function renderArticles() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const activeCategory =
        document
            .querySelector(
                ".category-card.active"
            )
            ?.dataset.category ||
        "all";


    let filtered =
        knowledgeArticles.filter(
            article => {

                const title =
                    (
                        article.title ||
                        ""
                    ).toLowerCase();


                const description =
                    (
                        article.description ||
                        ""
                    ).toLowerCase();


                const course =
                    (
                        article.course ||
                        ""
                    ).toLowerCase();


                const department =
                    (
                        article.department ||
                        ""
                    ).toLowerCase();


                const keywords =
                    (
                        article.keywords ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(
                        search
                    ) ||
                    description.includes(
                        search
                    ) ||
                    course.includes(
                        search
                    ) ||
                    department.includes(
                        search
                    ) ||
                    keywords.includes(
                        search
                    );


                const matchesCategory =
                    matchesCategoryFilter(
                        article,
                        activeCategory
                    );


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    /* =====================================
       SORT
    ===================================== */

    filtered =
        sortArticles(
            filtered
        );


    /* =====================================
       CLEAR OLD CARDS
    ===================================== */

    articleGrid.innerHTML =
        "";


    /* =====================================
       RESULT COUNT
    ===================================== */

    articleCount.textContent =
        search
            ? `${filtered.length} result${
                filtered.length === 1
                    ? ""
                    : "s"
              } found`
            : `${filtered.length} articles`;


    /* =====================================
       NO RESULTS
    ===================================== */

    if (
        filtered.length === 0
    ) {

        noResults.style.display =
            "block";

        return;

    }


    noResults.style.display =
        "none";


    /* =====================================
       CREATE CARDS
    ===================================== */

    filtered.forEach(
        article => {

            const card =
                createArticleCard(
                    article
                );


            articleGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================
   CREATE ARTICLE CARD
========================================= */

function createArticleCard(
    article
) {

    const card =
        document.createElement(
            "article"
        );


    const category =
        getCategory(
            article
        );


    const popularity =
        Number(
            article.popularity ||
            0
        );


    const views =
        Number(
            article.views ||
            0
        );


    card.className =
        "article-card";


    card.dataset.category =
        category.slug;


    card.dataset.title =
        article.title ||
        "Untitled";


    card.dataset.popularity =
        popularity;


    card.innerHTML = `

        <div class="article-top">

            <span class="article-category">
                ${escapeHTML(
                    category.label
                )}
            </span>

            <span class="article-icon">
                ${getCategoryIcon(
                    category.slug
                )}
            </span>

        </div>


        <h3>
            ${escapeHTML(
                article.title ||
                "Untitled Query"
            )}
        </h3>


        <p>
            ${escapeHTML(
                truncate(
                    article.description ||
                    "No description available.",
                    140
                )
            )}
        </p>


        <div class="article-footer">

            <span>
                Academic Query
            </span>

            <span>
                👁 ${formatNumber(
                    views
                )} views
            </span>

        </div>

    `;


    card.addEventListener(
        "click",
        () => {

            openArticle(
                article
            );

        }
    );


    return card;

}


/* =========================================
   CATEGORY
========================================= */

function getCategory(
    article
) {

    const department =
        (
            article.department ||
            "General"
        )
        .trim();


    const slug =
        department
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    return {

        slug:
            slug,

        label:
            department
                .toUpperCase()

    };

}


/* =========================================
   CATEGORY FILTER
========================================= */

function matchesCategoryFilter(
    article,
    activeCategory
) {

    if (
        activeCategory ===
        "all"
    ) {

        return true;

    }


    const category =
        getCategory(
            article
        );


    /*
     * The existing HTML has categories such as:
     *
     * computer-science
     * academics
     * registrar
     * student-services
     *
     * Your Firestore department might be:
     *
     * MCA
     *
     * So also allow matching against
     * course/department values.
     */

    const values = [

        article.department,

        article.course,

        article.category

    ]
        .filter(Boolean)
        .map(
            value =>
                String(value)
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        "-"
                    )
        );


    return (
        category.slug ===
        activeCategory
        ||
        values.includes(
            activeCategory
        )
    );

}


/* =========================================
   CATEGORY COUNTS
========================================= */

function updateCategoryCounts() {

    categoryCards.forEach(
        card => {

            const category =
                card.dataset.category;


            const count =
                category ===
                "all"

                    ? knowledgeArticles.length

                    : knowledgeArticles.filter(
                        article =>
                            matchesCategoryFilter(
                                article,
                                category
                            )
                    ).length;


            const small =
                card.querySelector(
                    "small"
                );


            if (small) {

                small.textContent =
                    `${count} ${
                        count === 1
                            ? "article"
                            : "articles"
                    }`;

            }

        }
    );

}


/* =========================================
   SORT
========================================= */

function sortArticles(
    articles
) {

    const sorted =
        [...articles];


    if (
        sortSelect.value ===
        "az"
    ) {

        sorted.sort(
            (a, b) =>
                String(
                    a.title ||
                    ""
                ).localeCompare(
                    String(
                        b.title ||
                        ""
                    )
                )
        );

    }


    else if (
        sortSelect.value ===
        "popular"
    ) {

        sorted.sort(
            (a, b) =>
                Number(
                    b.popularity ||
                    0
                )
                -
                Number(
                    a.popularity ||
                    0
                )
        );

    }


    else if (
        sortSelect.value ===
        "recent"
    ) {

        sorted.sort(
            (a, b) =>
                getTimestamp(
                    b.updatedAt ||
                    b.resolvedAt ||
                    b.createdAt
                )
                -
                getTimestamp(
                    a.updatedAt ||
                    a.resolvedAt ||
                    a.createdAt
                )
        );

    }


    return sorted;

}


/* =========================================
   SEARCH
========================================= */

searchButton.addEventListener(
    "click",
    renderArticles
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            renderArticles();

        }

    }
);


searchInput.addEventListener(
    "input",
    renderArticles
);


/* =========================================
   CATEGORY BUTTONS
========================================= */

categoryCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {

                categoryCards.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                card.classList.add(
                    "active"
                );


                renderArticles();

            }
        );

    }
);


/* =========================================
   SEARCH HINTS
========================================= */

document
    .querySelectorAll(
        ".search-hints button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    searchInput.value =
                        button.dataset.search;


                    renderArticles();


                    searchInput.focus();

                }
            );

        }
    );


/* =========================================
   SORT
========================================= */

sortSelect.addEventListener(
    "change",
    renderArticles
);


/* =========================================
   OPEN ARTICLE
========================================= */

function openArticle(
    article
) {

    modalTitle.textContent =
        article.title ||
        "Untitled Query";


    const category =
        getCategory(
            article
        );


    modalCategory.textContent =
        category.label;


    const answer =
        article.knowledgeBaseAnswer ||
        article.aiAnswer ||
        article.facultyAnswer;


    let content = `

        <h3>
            Query
        </h3>

        <p>
            ${escapeHTML(
                article.description ||
                "No description available."
            )}
        </p>

    `;


    if (answer) {

        content += `

            <h3>
                Answer
            </h3>

            <p>
                ${escapeHTML(
                    answer
                )}
            </p>

        `;

    } else {

        content += `

            <h3>
                Answer
            </h3>

            <p>
                The answer for this query
                is not available yet.
            </p>

        `;

    }


    content += `

        <div class="source-note">

            <strong>
                Course
            </strong>

            <span>
                ${escapeHTML(
                    article.course ||
                    "Not specified"
                )}
            </span>

        </div>


        <div class="source-note">

            <strong>
                Source
            </strong>

            <span>
                DeptConnect Knowledge Base
            </span>

        </div>

    `;


    modalContent.innerHTML =
        content;


    articleModal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";

}


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
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeArticleModal
    );


articleModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            articleModal
        ) {

            closeArticleModal();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeArticleModal();

        }

    }
);


/* =========================================
   FEEDBACK
========================================= */

const feedbackButtons =
    document.querySelectorAll(
        ".feedback-button"
    );


const feedbackMessage =
    document.getElementById(
        "feedbackMessage"
    );


feedbackButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                feedbackButtons.forEach(
                    item =>
                        item.classList.remove(
                            "selected"
                        )
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

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


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
    logoutButtonExists()
) {

    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
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


/* =========================================
   SESSION SEARCH
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

}


/* =========================================
   HELPERS
========================================= */

function logoutButtonExists() {

    return Boolean(
        document.getElementById(
            "logoutButton"
        )
    );

}


function getTimestamp(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate()
            .getTime();

    }


    if (
        value.seconds !==
        undefined
    ) {

        return value.seconds *
            1000;

    }


    const date =
        new Date(
            value
        );


    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();

}


function truncate(
    text,
    length
) {

    if (
        text.length <=
        length
    ) {

        return text;

    }


    return (
        text.substring(
            0,
            length
        )
        +
        "..."
    );

}


function formatNumber(
    number
) {

    return Number(
        number || 0
    ).toLocaleString(
        "en-IN"
    );

}


function getCategoryIcon(
    category
) {

    switch (
        category
    ) {

        case "computer-science":

            return "&lt;/&gt;";


        case "academics":

            return "▣";


        case "registrar":

            return "▤";


        case "student-services":

            return "♙";


        default:

            return "◈";

    }

}


function escapeHTML(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}