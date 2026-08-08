/* =================================
   ELEMENTS
================================= */

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const rememberMe = document.getElementById("rememberMe");

const signinButton = document.getElementById("signinButton");

const buttonText = document.getElementById("buttonText");

const loader = document.getElementById("loader");

const loginError = document.getElementById("loginError");

const emailError = document.getElementById("emailError");

const passwordError = document.getElementById("passwordError");

const forgotPassword = document.getElementById("forgotPassword");


/* =================================
   LOAD REMEMBERED EMAIL
================================= */

document.addEventListener("DOMContentLoaded", () => {

    const savedEmail = localStorage.getItem("deptconnect_email");

    if (savedEmail) {

        emailInput.value = savedEmail;

        rememberMe.checked = true;

    }

});


/* =================================
   EMAIL VALIDATION
================================= */

function validateEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);

}


/* =================================
   PASSWORD VALIDATION
================================= */

function validatePassword(password) {

    return password.length >= 6;

}


/* =================================
   CLEAR ERRORS
================================= */

function clearErrors() {

    emailError.textContent = "";

    passwordError.textContent = "";

    loginError.style.display = "none";

}


/* =================================
   SHOW LOGIN ERROR
================================= */

function showLoginError(message) {

    loginError.textContent = message;

    loginError.style.display = "block";

}


/* =================================
   LOGIN SUBMIT
================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearErrors();


    const email = emailInput.value.trim();

    const password = passwordInput.value;


    let isValid = true;


    /* EMAIL */

    if (!email) {

        emailError.textContent =
            "Please enter your institutional email.";

        isValid = false;

    }

    else if (!validateEmail(email)) {

        emailError.textContent =
            "Please enter a valid email address.";

        isValid = false;

    }


    /* PASSWORD */

    if (!password) {

        passwordError.textContent =
            "Please enter your password.";

        isValid = false;

    }

    else if (!validatePassword(password)) {

        passwordError.textContent =
            "Password must contain at least 6 characters.";

        isValid = false;

    }


    if (!isValid) {

        return;

    }


    /* REMEMBER EMAIL */

    if (rememberMe.checked) {

        localStorage.setItem(
            "deptconnect_email",
            email
        );

    }

    else {

        localStorage.removeItem(
            "deptconnect_email"
        );

    }


    /* LOADING STATE */

    signinButton.disabled = true;

    signinButton.classList.add("loading");


    /*
        DEMO LOGIN DELAY

        Later this will be replaced with:

        fetch("/api/auth/login", {...})

        or Firebase authentication.
    */

    await new Promise(resolve =>
        setTimeout(resolve, 1500)
    );


    /*
        DEMO CREDENTIALS

        Remove this when backend authentication
        is implemented.
    */

    const demoEmail = "student@university.edu";

    const demoPassword = "student123";


    if (
        email === demoEmail &&
        password === demoPassword
    ) {

        /*
            Save login state.
        */

        sessionStorage.setItem(
            "deptconnect_logged_in",
            "true"
        );

        sessionStorage.setItem(
            "deptconnect_student_email",
            email
        );


        /*
            Redirect to dashboard.

            Change dashboard.html to your
            actual dashboard page later.
        */

        window.location.href = "dashboard.html";

    }

    else {

        showLoginError(
            "Invalid institutional email or password."
        );

        signinButton.disabled = false;

        signinButton.classList.remove("loading");

    }

});


/* =================================
   FORGOT PASSWORD
================================= */

forgotPassword.addEventListener("click", (event) => {

    event.preventDefault();

    alert(
        "Password recovery will be implemented with the authentication system."
    );

});