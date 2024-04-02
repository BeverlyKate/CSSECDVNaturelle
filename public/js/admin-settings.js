import {resetError, showError} from "./form.js";

const error_container = document.getElementById("form-settings-error");

const modal_settings = document.getElementById("modal-settings-edit");

modal_settings.addEventListener("show.bs.modal", function() {
    resetError(error_container);
});

document.querySelector("#form-settings-edit").addEventListener("submit", function(e, d) {
    e.preventDefault();

    let input_username = document.getElementById("input-settings-username");
    let input_old_password = document.getElementById("input-settings-old-password");
    let input_new_password = document.getElementById("input-settings-new-password");

    if (input_old_password.value === "") {
        showError("Please enter your current password to continue.", error_container);
        input_old_password.focus();
        return;
    }

    if (input_username.value === "") {
        showError("Please enter a username.", error_container);
        input_username.focus();
        return;
    }

    let btn_save = this.closest(".modal-content").querySelector(".btn-modal-success");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/admin/settings", {
        username: input_username.value,
        old_password: input_old_password.value,
        new_password: input_new_password.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-check");
            btn_save.disabled = false;

            bootstrap.Modal.getInstance(modal_settings).hide();
            snackbar({
                type: "primary",
                text: "Admin account settings have been successfully edited!"
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
            bootstrap.Modal.getInstance(modal_settings).hide();
            snackbar({
                type: "error",
                text: "Error: Something went wrong while updating the Admin account settings.",
                duration: "long"
            });
        }
    })
});