import {resetError, showError, isEmailValid, isContactNumValid} from "./form.js";

const error_container = document.getElementById("form-customer-settings-error");

document.querySelector("#form-customer-settings").addEventListener("submit", function(e) {
    e.preventDefault();

    let input_id = document.getElementById("input-settings-customer-id");
    let input_fname = document.getElementById("input-settings-customer-fname");
    let input_lname = document.getElementById("input-settings-customer-lname");
    let input_email = document.getElementById("input-settings-customer-email");
    let input_contact = document.getElementById("input-settings-customer-contact");
    let input_old_password = document.getElementById("input-settings-customer-old-password");
    let input_new_password = document.getElementById("input-settings-customer-new-password");

    if (input_old_password.value === "") {
        showError("Please enter your current password to continue.", error_container);
        input_old_password.focus();
        return;
    }

    if (input_fname.value === "") {
        showError("Please enter your first name.", error_container);
        input_fname.focus();
        return;
    }

    if (input_lname.value === "") {
        showError("Please enter your last name.", error_container);
        input_lname.focus();
        return;
    }

    if (input_email.value === "") {
        showError("Please enter your email address.", error_container);
        input_email.focus();
        return;
    }

    if (input_contact.value === "") {
        showError("Please enter your contact number.", error_container);
        input_contact.focus();
        return;
    }

    if (!isEmailValid(input_email.value)) {
        showError("Please enter a valid email address.", error_container);
        input_email.focus();
        return;
    }

    if (!isContactNumValid(input_contact.value)) {
        showError("Please enter a valid contact number in this format: 09XXXXXXXXX", error_container);
        input_contact.focus();
        return;
    }

    let btn_save = document.getElementById("customer-save-settings-btn");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/settings", {
        customer_id: input_id.value,
        fname: input_fname.value,
        lname: input_lname.value,
        email: input_email.value,
        contact: input_contact.value,
        old_password: input_old_password.value,
        new_password: input_new_password.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            resetError(error_container);

            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-check");
            btn_save.disabled = false;

            snackbar({
                type: "primary",
                text: "Profile settings have been successfully edited!"
            });
            setTimeout(function() {
                snackbar({
                    type: "primary",
                    text: "Reloading the page…"
                });
                setTimeout(function() {
                    window.location.reload();
                }, DURATION.SHORT + 300);
            }, DURATION.SHORT + 300);
        }
    }).fail(function(data, status, xhr) {
        btn_save_icon.className = "";
        btn_save_icon.classList.add("fa", "fa-check");
        btn_save.disabled = false;

        if (data.responseJSON !== undefined) {
            showError(data.responseJSON.error, error_container);
        } else {
            snackbar({
                type: "error",
                text: "Error: Something went wrong while updating your profile settings.",
                duration: "long"
            });
        }
    })
});