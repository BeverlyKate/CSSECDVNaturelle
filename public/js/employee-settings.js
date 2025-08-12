import {resetError, showError} from "./form.js";

// Basic Settings Form Handler
document.querySelector("#form-employee-basic-settings").addEventListener("submit", function(e) {
    e.preventDefault();

    const error_container = document.getElementById("form-employee-basic-settings-error");
    resetError(error_container);

    let input_employee_id = document.getElementById("input-basic-settings-employee-id").value;
    let input_first_name = document.getElementById("input-basic-settings-employee-fname");
    let input_last_name = document.getElementById("input-basic-settings-employee-lname");
    let input_email = document.getElementById("input-basic-settings-employee-email");
    let input_contact = document.getElementById("input-basic-settings-employee-contact");

    if (input_first_name.value === "") {
        showError("Please enter a first name.", error_container);
        input_first_name.focus();
        return;
    }

    if (input_last_name.value === "") {
        showError("Please enter a last name.", error_container);
        input_last_name.focus();
        return;
    }

    const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (input_email.value === "" || !validEmailRegex.test(input_email.value)) {
        showError("Please enter a valid email.", error_container);
        input_email.focus();
        return;
    }

    const validContactNumRegex = /^(09)\d{9}/;
    if (input_contact.value === "" || !validContactNumRegex.test(input_contact.value)) {
        showError("Please enter a valid contact number.", error_container);
        input_contact.focus();
        return;
    }

    let btn_save = document.getElementById("employee-save-basic-settings-btn");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/employee/settings", {
        id: input_employee_id,
        fname: input_first_name.value,
        lname: input_last_name.value,
        email: input_email.value,
        contactNumber: input_contact.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-check");
            btn_save.disabled = false;

            snackbar({
                type: "primary",
                text: "Basic information updated successfully!"
            });
            setTimeout(function() {
                window.location.reload();
            }, 1500);
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
                text: "Error: Something went wrong while updating basic information.",
                duration: "long"
            });
        }
    });
});

// Password Change Modal Handler
document.querySelector("#form-employee-password-change").addEventListener("submit", function(e) {
    e.preventDefault();

    const error_container = document.getElementById("form-employee-password-change-error");
    resetError(error_container);

    let input_employee_id = document.getElementById("input-password-change-employee-id").value;
    let input_current_password = document.getElementById("input-password-change-current-password");
    let input_new_password = document.getElementById("input-password-change-new-password");
    let input_confirm_password = document.getElementById("input-password-change-confirm-password");

    if (input_current_password.value === "") {
        showError("Please enter your current password.", error_container);
        input_current_password.focus();
        return;
    }

    if (input_new_password.value === "" || input_new_password.value.length < 8) {
        showError("Please enter a new password that is at least 8 characters.", error_container);
        input_new_password.focus();
        return;
    }

    if (input_new_password.value !== input_confirm_password.value) {
        showError("New password and confirm password do not match.", error_container);
        input_confirm_password.focus();
        return;
    }

    let btn_save = document.getElementById("employee-save-password-btn");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/employee/change-password", {
        id: input_employee_id,
        current_password: input_current_password.value,
        new_password: input_new_password.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-check");
            btn_save.disabled = false;

            bootstrap.Modal.getInstance(document.getElementById("modal-employee-password-change")).hide();
            snackbar({
                type: "primary",
                text: "Password changed successfully!"
            });
            
            // Clear the form
            input_current_password.value = "";
            input_new_password.value = "";
            input_confirm_password.value = "";
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
                text: "Error: Something went wrong while changing password.",
                duration: "long"
            });
        }
    });
});

// Security Questions Modal Handler
document.querySelector("#form-employee-security-questions").addEventListener("submit", function(e) {
    e.preventDefault();

    const error_container = document.getElementById("form-employee-security-questions-error");
    resetError(error_container);

    let input_employee_id = document.getElementById("input-security-questions-employee-id").value;
    let input_question1 = document.getElementById("input-security-question-1");
    let input_answer1 = document.getElementById("input-security-answer-1");
    let input_question2 = document.getElementById("input-security-question-2");
    let input_answer2 = document.getElementById("input-security-answer-2");

    if (input_question1.value === "") {
        showError("Please select a security question.", error_container);
        input_question1.focus();
        return;
    }

    if (input_answer1.value === "") {
        showError("Please enter an answer for the first security question.", error_container);
        input_answer1.focus();
        return;
    }

    if (input_question2.value === "") {
        showError("Please select a second security question.", error_container);
        input_question2.focus();
        return;
    }

    if (input_answer2.value === "") {
        showError("Please enter an answer for the second security question.", error_container);
        input_answer2.focus();
        return;
    }

    if (input_question1.value === input_question2.value) {
        showError("Please select different security questions.", error_container);
        input_question2.focus();
        return;
    }

    let btn_save = document.getElementById("employee-save-security-questions-btn");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/employee/update-security-questions", {
        id: input_employee_id,
        securityQuestion1: input_question1.value,
        securityAnswer1: input_answer1.value,
        securityQuestion2: input_question2.value,
        securityAnswer2: input_answer2.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-check");
            btn_save.disabled = false;

            bootstrap.Modal.getInstance(document.getElementById("modal-employee-security-questions")).hide();
            snackbar({
                type: "primary",
                text: "Security questions updated successfully!"
            });
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
                text: "Error: Something went wrong while updating security questions.",
                duration: "long"
            });
        }
    });
});

// Modal event handlers to reset errors when modals are shown
document.getElementById("modal-employee-password-change")?.addEventListener("show.bs.modal", function() {
    resetError(document.getElementById("form-employee-password-change-error"));
});

document.getElementById("modal-employee-security-questions")?.addEventListener("show.bs.modal", function() {
    resetError(document.getElementById("form-employee-security-questions-error"));
});