/* =========================================
   PROFILE PHOTO ELEMENTS
========================================= */

const profileImage =
    document.getElementById(
        "profileImage"
    );

const profilePlaceholder =
    document.getElementById(
        "profilePlaceholder"
    );

const navAvatar =
    document.getElementById(
        "navAvatar"
    );

const photoInput =
    document.getElementById(
        "photoInput"
    );

const photoModal =
    document.getElementById(
        "photoModal"
    );

const photoPreview =
    document.getElementById(
        "photoPreview"
    );

const previewPlaceholder =
    document.getElementById(
        "previewPlaceholder"
    );

let selectedPhoto = null;

let removePhoto = false;


/* =========================================
   OPEN PHOTO MODAL
========================================= */

document
    .getElementById(
        "changePhotoButton"
    )
    .addEventListener(
        "click",
        () => {

            selectedPhoto = null;

            removePhoto = false;

            loadCurrentPhotoPreview();

            photoModal.classList.add(
                "show"
            );

            document.body.style.overflow =
                "hidden";

        }
    );


/* =========================================
   LOAD CURRENT PHOTO
========================================= */

function loadCurrentPhotoPreview() {

    const savedPhoto =
        localStorage.getItem(
            "deptconnect_profile_photo"
        );


    if (savedPhoto) {

        photoPreview.src =
            savedPhoto;

        photoPreview.style.display =
            "block";

        previewPlaceholder.style.display =
            "none";

    } else {

        photoPreview.style.display =
            "none";

        previewPlaceholder.style.display =
            "flex";

    }

}


/* =========================================
   UPLOAD BUTTON
========================================= */

document
    .getElementById(
        "uploadPhotoButton"
    )
    .addEventListener(
        "click",
        () => {

            photoInput.click();

        }
    );


/* =========================================
   FILE SELECTED
========================================= */

photoInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];


        if (!file) {
            return;
        }


        /*
            Basic validation
        */

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please select a JPG, PNG or WEBP image."
            );

            photoInput.value = "";

            return;

        }


        /*
            5 MB limit
        */

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "Image size should be less than 5 MB."
            );

            photoInput.value = "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                selectedPhoto =
                    event.target.result;

                removePhoto = false;


                photoPreview.src =
                    selectedPhoto;


                photoPreview.style.display =
                    "block";


                previewPlaceholder.style.display =
                    "none";

            };


        reader.readAsDataURL(file);

    }
);


/* =========================================
   REMOVE PHOTO
========================================= */

document
    .getElementById(
        "removePhotoButton"
    )
    .addEventListener(
        "click",
        () => {

            selectedPhoto = null;

            removePhoto = true;


            photoPreview.style.display =
                "none";


            previewPlaceholder.style.display =
                "flex";


            photoInput.value = "";

        }
    );


/* =========================================
   SAVE PHOTO
========================================= */

document
    .getElementById(
        "savePhotoButton"
    )
    .addEventListener(
        "click",
        () => {

            if (removePhoto) {

                localStorage.removeItem(
                    "deptconnect_profile_photo"
                );


                showDefaultProfile();

            }

            else if (selectedPhoto) {

                localStorage.setItem(
                    "deptconnect_profile_photo",
                    selectedPhoto
                );


                displayProfilePhoto(
                    selectedPhoto
                );

            }


            closePhotoModal();

            showToast(
                "Profile photo updated successfully"
            );

        }
    );


/* =========================================
   DISPLAY PROFILE PHOTO
========================================= */

function displayProfilePhoto(
    photo
) {

    profileImage.src =
        photo;

    profileImage.style.display =
        "block";

    profilePlaceholder.style.display =
        "none";


    /*
        Navbar avatar
    */

    navAvatar.innerHTML = "";

    const navImage =
        document.createElement(
            "img"
        );

    navImage.src =
        photo;

    navImage.alt =
        "Profile";

    navAvatar.appendChild(
        navImage
    );

}


/* =========================================
   DEFAULT PROFILE
========================================= */

function showDefaultProfile() {

    profileImage.style.display =
        "none";

    profilePlaceholder.style.display =
        "flex";


    navAvatar.innerHTML =
        "A";

}


/* =========================================
   CLOSE PHOTO MODAL
========================================= */

function closePhotoModal() {

    photoModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

    photoInput.value = "";

}


document
    .getElementById(
        "closePhotoModal"
    )
    .addEventListener(
        "click",
        closePhotoModal
    );


document
    .getElementById(
        "cancelPhotoButton"
    )
    .addEventListener(
        "click",
        closePhotoModal
    );


photoModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            photoModal
        ) {

            closePhotoModal();

        }

    }
);


/* =========================================
   LOAD SAVED PHOTO
========================================= */

function loadSavedPhoto() {

    const savedPhoto =
        localStorage.getItem(
            "deptconnect_profile_photo"
        );


    if (savedPhoto) {

        displayProfilePhoto(
            savedPhoto
        );

    } else {

        showDefaultProfile();

    }

}

loadSavedPhoto();


/* =========================================
   PERSONAL INFORMATION EDITING
========================================= */

const editButtons =
    document.querySelectorAll(
        ".edit-button"
    );


editButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const section =
                button.dataset.section;


            if (
                section === "personal"
            ) {

                enablePersonalEditing();

            }

        }
    );

});


/* =========================================
   ENABLE PERSONAL EDIT
========================================= */

function enablePersonalEditing() {

    document
        .getElementById(
            "fullName"
        )
        .hidden = true;


    document
        .getElementById(
            "fullNameInput"
        )
        .hidden = false;


    document
        .getElementById(
            "phoneNumber"
        )
        .hidden = true;


    document
        .getElementById(
            "phoneInput"
        )
        .hidden = false;


    document
        .getElementById(
            "personalActions"
        )
        .hidden = false;

}


/* =========================================
   CANCEL PERSONAL EDIT
========================================= */

document
    .querySelector(
        '[data-cancel="personal"]'
    )
    .addEventListener(
        "click",
        () => {

            disablePersonalEditing();

        }
    );


function disablePersonalEditing() {

    document
        .getElementById(
            "fullName"
        )
        .hidden = false;


    document
        .getElementById(
            "fullNameInput"
        )
        .hidden = true;


    document
        .getElementById(
            "phoneNumber"
        )
        .hidden = false;


    document
        .getElementById(
            "phoneInput"
        )
        .hidden = true;


    document
        .getElementById(
            "personalActions"
        )
        .hidden = true;

}


/* =========================================
   SAVE PERSONAL INFORMATION
========================================= */

document
    .querySelector(
        '[data-save="personal"]'
    )
    .addEventListener(
        "click",
        () => {

            const nameInput =
                document.getElementById(
                    "fullNameInput"
                );

            const phoneInput =
                document.getElementById(
                    "phoneInput"
                );


            const newName =
                nameInput.value.trim();

            const newPhone =
                phoneInput.value.trim();


            if (!newName) {

                alert(
                    "Name cannot be empty."
                );

                return;

            }


            document
                .getElementById(
                    "fullName"
                )
                .textContent =
                newName;


            document
                .getElementById(
                    "phoneNumber"
                )
                .textContent =
                newPhone;


            /*
                Store demo data locally.

                Later these become API calls.
            */

            localStorage.setItem(
                "deptconnect_student_name",
                newName
            );


            localStorage.setItem(
                "deptconnect_student_phone",
                newPhone
            );


            disablePersonalEditing();


            showToast(
                "Profile updated successfully"
            );

        }
    );


/* =========================================
   LOAD SAVED PERSONAL INFORMATION
========================================= */

function loadPersonalInformation() {

    const savedName =
        localStorage.getItem(
            "deptconnect_student_name"
        );

    const savedPhone =
        localStorage.getItem(
            "deptconnect_student_phone"
        );


    if (savedName) {

        document.getElementById(
            "fullName"
        ).textContent =
            savedName;


        document.getElementById(
            "fullNameInput"
        ).value =
            savedName;


        document.querySelector(
            ".profile-identity h2"
        ).textContent =
            savedName;

    }


    if (savedPhone) {

        document.getElementById(
            "phoneNumber"
        ).textContent =
            savedPhone;


        document.getElementById(
            "phoneInput"
        ).value =
            savedPhone;

    }

}

loadPersonalInformation();


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
   PROFILE DROPDOWN
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
        "pageLogoutButton"
    )
    .addEventListener(
        "click",
        logout
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

            closePhotoModal();

            profileMenu.classList.remove(
                "show"
            );

        }

    }
);