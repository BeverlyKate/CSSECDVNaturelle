import {resetError, showError} from "./form.js";

const error_container = document.getElementById("form-employee-settings-error");

const modal_settings = document.getElementById("modal-employee-settings-edit");

modal_settings.addEventListener("show.bs.modal", function() {
    resetError(error_container);
});

document.querySelector("#form-employee-settings").addEventListener("submit", function(e, d) {
    e.preventDefault();

    let input_employee_id = document.getElementById("input-settings-employee-id").value;
    let input_first_name = document.getElementById("input-settings-employee-fname");
    let input_last_name = document.getElementById("input-settings-employee-lname");
    let input_email = document.getElementById("input-settings-employee-email");
    let input_contact = document.getElementById("input-settings-employee-contact");
    let input_current_password = document.getElementById("input-settings-employee-current-password");
    let input_new_password = document.getElementById("input-settings-employee-new-password");

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

    if (input_current_password.value === "") {
        showError("Please enter your current password to save your changes.", error_container);
        input_current_password.focus();
        return;
    }

    if (input_new_password.value !== "" && input_new_password.value.length < 8) {
        showError("Please enter a new password that is at least 8 characters.", error_container);
        input_username.focus();
        return;
    }

    let btn_save = this.closest(".modal-content").querySelector(".btn-modal-success");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/employee/settings", {
        id: input_employee_id,
        fname: input_first_name.value,
        lname: input_last_name.value,
        email: input_email.value,
        contactNumber: input_contact.value,
        current_password: input_current_password.value,
        new_password: input_new_password.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-check");
            btn_save.disabled = false;

            bootstrap.Modal.getInstance(modal_settings).hide();
            snackbar({
                type: "primary",
                text: "Employee account settings have been successfully edited!"
            });
            location.reload()
        }
    }).fail(function(data, status, xhr) {
        btn_save_icon.className = "";
        btn_save_icon.classList.add("fa", "fa-check");
        btn_save.disabled = false;

        if (data.responseJSON !== undefined) {
            showError(data.responseJSON.error, error_container);
        } else {
            bootstrap.Modal.getInstance(modal_settings).hide();
            snackbar({
                type: "error",
                text: "Error: Something went wrong while updating the Employee account settings.",
                duration: "long"
            });
        }
    })
});