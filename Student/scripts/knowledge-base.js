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


/*
    IMPORTANT

    Do NOT read the active category
    directly from HTML.

    The page must initially show
    ALL responses.

    Category filtering happens only
    after the user clicks a category.
*/

let activeCategory = "all";


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
   LOAD ALL RESPONSES
========================================= */

async function loadKnowledgeBase() {

    try {

        console.log(
            "===================================="
        );

        console.log(
            "Loading ALL DeptConnect responses..."
        );

        console.log(
            "===================================="
        );


        /*
            IMPORTANT:

            We fetch the ENTIRE "response"
            collection.

            There is NO:

                where("status", "==", "resolved")

            and NO:

                where("isKnowledgeBase", "==", true)

            because this page is supposed to
            display every response stored in
            the response collection.
        */

        const responseCollection =
            collection(
                db,
                "responses"
            );


        const snapshot =
            await getDocs(
                responseCollection
            );


        console.log(
            "TOTAL FIRESTORE RESPONSE DOCUMENTS:",
            snapshot.size
        );


        knowledgeArticles = [];


        /* =====================================
           READ EVERY DOCUMENT
        ===================================== */

        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                console.log(
                    "Response document:",
                    documentSnapshot.id,
                    data
                );


                /*
                    Convert your actual Firestore
                    response structure into the
                    structure used by the UI.
                */

                const article = {

                    id:
                        documentSnapshot.id,


                    /* =========================
                       QUERY INFORMATION
                    ========================= */

                    title:
                        data.queryTitle ||
                        data.title ||
                        "Untitled Query",


                    description:
                        data.queryDescription ||
                        data.description ||
                        "No description available.",


                    /* =========================
                       RESPONSE
                    ========================= */

                    response:
                        data.response ||
                        "",


                    /*
                        Compatibility aliases.
                    */

                    facultyAnswer:
                        data.response ||
                        "",


                    knowledgeBaseAnswer:
                        data.response ||
                        "",


                    aiAnswer:
                        data.aiAnswer ||
                        "",


                    /* =========================
                       ACADEMIC INFORMATION
                    ========================= */

                    course:
                        data.course ||
                        "",


                    department:
                        data.department ||
                        "",


                    category:
                        data.category ||
                        "",


                    /* =========================
                       FACULTY INFORMATION
                    ========================= */

                    facultyId:
                        data.facultyId ||
                        "",


                    facultyName:
                        data.facultyName ||
                        "",


                    /* =========================
                       QUERY INFORMATION
                    ========================= */

                    queryId:
                        data.queryId ||
                        "",


                    studentId:
                        data.studentId ||
                        "",


                    priority:
                        data.priority ||
                        "",


                    status:
                        data.status ||
                        "",


                    /* =========================
                       AI INFORMATION
                    ========================= */

                    similarityScore:
                        data.similarityScore ||
                        0,


                    /* =========================
                       TIMESTAMPS
                    ========================= */

                    respondedAt:
                        data.respondedAt ||
                        null,


                    resolvedAt:
                        data.resolvedAt ||
                        null,


                    createdAt:
                        data.createdAt ||
                        null,


                    updatedAt:
                        data.updatedAt ||
                        null,


                    /* =========================
                       OPTIONAL
                    ========================= */

                    popularity:
                        data.popularity ||
                        0,


                    views:
                        data.views ||
                        0,


                    keywords:
                        data.keywords ||
                        ""

                };


                /*
                    Add EVERY document.

                    Nothing is filtered here.
                */

                knowledgeArticles.push(
                    article
                );

            }
        );


        console.log(
            "TOTAL RESPONSES LOADED:",
            knowledgeArticles.length
        );


        /* =====================================
           SORT NEWEST FIRST
        ===================================== */

        knowledgeArticles.sort(
            (a, b) => {

                return (

                    getTimestamp(
                        b.respondedAt ||
                        b.resolvedAt ||
                        b.updatedAt ||
                        b.createdAt
                    )

                    -

                    getTimestamp(
                        a.respondedAt ||
                        a.resolvedAt ||
                        a.updatedAt ||
                        a.createdAt
                    )

                );

            }
        );


        /*
            Make absolutely sure the page
            starts with ALL categories.
        */

        activeCategory =
            "all";


        categoryCards.forEach(
            card => {

                card.classList.remove(
                    "active"
                );

            }
        );


        /*
            If an "all" card exists,
            make it active.
        */

        categoryCards.forEach(
            card => {

                if (
                    card.dataset.category ===
                    "all"
                ) {

                    card.classList.add(
                        "active"
                    );

                }

            }
        );


        /* =====================================
           RENDER ALL
        ===================================== */

        renderArticles();

        updateCategoryCounts();


        console.log(
            "===================================="
        );

        console.log(
            "KNOWLEDGE BASE LOADED SUCCESSFULLY"
        );

        console.log(
            "Total articles:",
            knowledgeArticles.length
        );

        console.log(
            "===================================="
        );


    } catch (error) {

        console.error(
            "ERROR LOADING RESPONSES:",
            error
        );


        knowledgeArticles = [];


        if (articleGrid) {

            articleGrid.innerHTML = "";
        }


        if (noResults) {

            noResults.style.display =
                "block";
        }


        if (articleCount) {

            articleCount.textContent =
                "Unable to load responses";
        }

    }

}


/* =========================================
   RENDER ARTICLES
========================================= */

function renderArticles() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    /*
        IMPORTANT:

        Use our own activeCategory variable.

        Do NOT use:

        .category-card.active

        because that was causing the page
        to depend on whatever category was
        marked active in the HTML.
    */

    let filtered =
        knowledgeArticles.filter(
            article => {


                /* =========================
                   SEARCH
                ========================= */

                const title =
                    String(
                        article.title ||
                        ""
                    )
                        .toLowerCase();


                const description =
                    String(
                        article.description ||
                        ""
                    )
                        .toLowerCase();


                const course =
                    String(
                        article.course ||
                        ""
                    )
                        .toLowerCase();


                const department =
                    String(
                        article.department ||
                        ""
                    )
                        .toLowerCase();


                const answer =
                    String(
                        article.response ||
                        ""
                    )
                        .toLowerCase();


                const faculty =
                    String(
                        article.facultyName ||
                        ""
                    )
                        .toLowerCase();


                const keywords =
                    String(
                        article.keywords ||
                        ""
                    )
                        .toLowerCase();


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

                    answer.includes(
                        search
                    ) ||

                    faculty.includes(
                        search
                    ) ||

                    keywords.includes(
                        search
                    );


                /* =========================
                   CATEGORY
                ========================= */

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

    if (articleGrid) {

        articleGrid.innerHTML = "";
    }


    /* =====================================
       COUNT
    ===================================== */

    if (articleCount) {

        articleCount.textContent =
            search

                ? `${filtered.length} result${
                    filtered.length === 1
                        ? ""
                        : "s"
                } found`

                : `${filtered.length} responses`;
    }


    /* =====================================
       NO RESULTS
    ===================================== */

    if (
        filtered.length === 0
    ) {

        if (noResults) {

            noResults.style.display =
                "block";
        }

        return;
    }


    if (noResults) {

        noResults.style.display =
            "none";
    }


    /* =====================================
       CREATE EVERY CARD
    ===================================== */

    filtered.forEach(
        article => {

            const card =
                createArticleCard(
                    article
                );


            if (articleGrid) {

                articleGrid.appendChild(
                    card
                );

            }

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
        "Untitled Query";


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

                ${escapeHTML(
                    article.facultyName ||
                    "Faculty Response"
                )}

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
        String(
            article.department ||
            article.category ||
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
            department.toUpperCase()

    };

}


/* =========================================
   CATEGORY FILTER
========================================= */

function matchesCategoryFilter(
    article,
    selectedCategory
) {

    /*
        ALL means literally ALL responses.
    */

    if (
        selectedCategory ===
        "all"
    ) {

        return true;
    }


    const category =
        getCategory(
            article
        );


    const values = [

        article.department,

        article.course,

        article.category

    ]

        .filter(Boolean)

        .map(
            value =>

                String(
                    value
                )
                    .trim()
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        "-"
                    )
        );


    return (

        category.slug ===
        selectedCategory

        ||

        values.includes(
            selectedCategory
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

                    ?

                    knowledgeArticles.length

                    :

                    knowledgeArticles.filter(
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
                            ? "response"
                            : "responses"
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


    /*
        A-Z
    */

    if (
        sortSelect &&
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


    /*
        Popular
    */

    else if (
        sortSelect &&
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


    /*
        Recent / default
    */

    else {

        sorted.sort(
            (a, b) =>

                getTimestamp(
                    b.respondedAt ||
                    b.resolvedAt ||
                    b.updatedAt ||
                    b.createdAt
                )

                -

                getTimestamp(
                    a.respondedAt ||
                    a.resolvedAt ||
                    a.updatedAt ||
                    a.createdAt
                )
        );

    }


    return sorted;

}


/* =========================================
   SEARCH BUTTON
========================================= */

if (searchButton) {

    searchButton.addEventListener(
        "click",
        renderArticles
    );

}


/* =========================================
   SEARCH INPUT
========================================= */

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                renderArticles();

            }

        }
    );


    searchInput.addEventListener(
        "input",
        renderArticles
    );

}


/* =========================================
   CATEGORY BUTTONS
========================================= */

categoryCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {


                /*
                    Get the category the user
                    explicitly clicked.
                */

                activeCategory =
                    card.dataset.category ||
                    "all";


                /*
                    Update active visual state.
                */

                categoryCards.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
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

                    if (
                        searchInput
                    ) {

                        searchInput.value =
                            button.dataset.search ||
                            "";

                        renderArticles();

                        searchInput.focus();

                    }

                }
            );

        }
    );


/* =========================================
   SORT CHANGE
========================================= */

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        renderArticles
    );

}


/* =========================================
   OPEN ARTICLE
========================================= */

function openArticle(
    article
) {

    if (
        !articleModal
    ) {

        return;
    }


    if (
        modalTitle
    ) {

        modalTitle.textContent =
            article.title ||
            "Untitled Query";

    }


    const category =
        getCategory(
            article
        );


    if (
        modalCategory
    ) {

        modalCategory.textContent =
            category.label;

    }


    /*
        ACTUAL FIRESTORE FIELD:

            response

        This is the important field.
    */

    const answer =
        article.response ||
        article.facultyAnswer ||
        article.knowledgeBaseAnswer ||
        article.aiAnswer;


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


    /* =====================================
       RESPONSE
    ===================================== */

    content += `

        <h3>
            Answer
        </h3>

    `;


    if (
        answer
    ) {

        content += `

            <p>

                ${escapeHTML(
                    answer
                )}

            </p>

        `;

    }

    else {

        content += `

            <p>

                No response content available.

            </p>

        `;

    }


    /* =====================================
       METADATA
    ===================================== */

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
                Department
            </strong>

            <span>

                ${escapeHTML(
                    article.department ||
                    "Not specified"
                )}

            </span>

        </div>


        <div class="source-note">

            <strong>
                Faculty
            </strong>

            <span>

                ${escapeHTML(
                    article.facultyName ||
                    "Not specified"
                )}

            </span>

        </div>


        <div class="source-note">

            <strong>
                Priority
            </strong>

            <span>

                ${escapeHTML(
                    article.priority ||
                    "Not specified"
                )}

            </span>

        </div>


        <div class="source-note">

            <strong>
                Status
            </strong>

            <span>

                ${escapeHTML(
                    article.status ||
                    "Not specified"
                )}

            </span>

        </div>


        <div class="source-note">

            <strong>
                Source
            </strong>

            <span>
                DeptConnect Response Database
            </span>

        </div>

    `;


    if (
        modalContent
    ) {

        modalContent.innerHTML =
            content;

    }


    articleModal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================
   CLOSE ARTICLE MODAL
========================================= */

function closeArticleModal() {

    if (
        !articleModal
    ) {

        return;
    }


    articleModal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


const closeModalButton =
    document.getElementById(
        "closeModal"
    );


if (
    closeModalButton
) {

    closeModalButton.addEventListener(
        "click",
        closeArticleModal
    );

}


if (
    articleModal
) {

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

}


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
                    feedbackMessage
                ) {

                    if (
                        button.dataset.feedback ===
                        "yes"
                    ) {

                        feedbackMessage.textContent =
                            "Thanks! Your feedback helps improve the Knowledge Base.";

                    }

                    else {

                        feedbackMessage.textContent =
                            "Thanks. You can ask a query if you still need help.";

                    }

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

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


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


            }

            catch (error) {

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


if (
    savedSearch &&
    searchInput
) {

    searchInput.value =
        savedSearch;


    sessionStorage.removeItem(
        "knowledge_search"
    );


    renderArticles();

}


/* =========================================
   HELPER:
   FIRESTORE TIMESTAMP
========================================= */

function getTimestamp(
    value
) {

    if (
        !value
    ) {

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

        return value
            .toDate()
            .getTime();

    }


    if (
        value.seconds !==
        undefined
    ) {

        return (
            Number(
                value.seconds
            ) * 1000
        );

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


/* =========================================
   TRUNCATE
========================================= */

function truncate(
    text,
    length
) {

    const value =
        String(
            text ||
            ""
        );


    if (
        value.length <=
        length
    ) {

        return value;

    }


    return (
        value.substring(
            0,
            length
        )
        +
        "..."
    );

}


/* =========================================
   NUMBER FORMAT
========================================= */

function formatNumber(
    number
) {

    return Number(
        number ||
        0
    ).toLocaleString(
        "en-IN"
    );

}


/* =========================================
   CATEGORY ICON
========================================= */

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


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(
    value
) {

    return String(
        value ||
        ""
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