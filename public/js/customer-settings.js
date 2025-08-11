import {resetError, showError, isEmailValid, isContactNumValid} from "./form.js";

const error_container = document.getElementById("form-customer-settings-error");

document.querySelector("#form-customer-settings").addEventListener("submit", function(e) {
    e.preventDefault();

    let input_id = document.getElementById("input-settings-customer-id");
    let input_fname = document.getElementById("input-settings-customer-fname");
    let input_lname = document.getElementById("input-settings-customer-lname");
    let input_email = document.getElementById("input-settings-customer-email");
    let input_contact = document.getElementById("input-settings-customer-contact");

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
        contact: input_contact.value
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

// Password Change Modal Functionality
document.getElementById('change-password-btn')?.addEventListener('click', function() {
    // Check if user has security questions set up
    fetch('/check-security-questions')
    .then(response => response.json())
    .then(data => {
        if (data.hasSecurityQuestions) {
            // Load security questions and show modal
            loadSecurityQuestions();
        } else {
            // Show error that security questions are required
            showError('You need to set up security questions before you can change your password. Please contact support for assistance.', error_container);
        }
    })
    .catch(error => {
        console.error('Error checking security questions:', error);
        showError('An error occurred. Please try again.', error_container);
    });
});

function loadSecurityQuestions() {
    // Get the logged-in user's email from the form
    const userEmail = document.getElementById('input-settings-customer-email').value;
    
    fetch(`/security-questions?email=${encodeURIComponent(userEmail)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const questions = [data.question1, data.question2].filter(q => q); // Filter out null questions
            displaySecurityQuestions(questions);
            document.getElementById('security-question-modal').style.display = 'block';
        } else {
            showError('Unable to load security questions. Please try again.', error_container);
        }
    })
    .catch(error => {
        console.error('Error loading security questions:', error);
        showError('An error occurred while loading security questions.', error_container);
    });
}

function displaySecurityQuestions(questions) {
    const container = document.getElementById('security-questions-container');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'mb-3';
        questionDiv.innerHTML = `
            <label class="form-label">${question}</label>
            <input type="text" class="form-control security-answer" id="answer-${index}" placeholder="Enter your answer">
        `;
        container.appendChild(questionDiv);
    });
}

// Security Questions Modal Event Listeners
document.getElementById('submit-security-answers')?.addEventListener('click', function() {
    const answers = [];
    document.querySelectorAll('.security-answer').forEach(input => {
        answers.push(input.value.trim());
    });
    
    if (answers.some(answer => answer === '')) {
        const errorElement = document.getElementById('security-error');
        errorElement.textContent = 'Please answer all security questions.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    // Verify security answers
    fetch('/verify-security-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answers })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('security-question-modal').style.display = 'none';
            document.getElementById('new-password-modal').style.display = 'block';
            setupPasswordValidation();
        } else {
            const errorElement = document.getElementById('security-error');
            errorElement.textContent = 'Security answers are incorrect. Please try again.';
            errorElement.setAttribute('data-error-status', 'error');
        }
    })
    .catch(error => {
        console.error('Error verifying security answers:', error);
        const errorElement = document.getElementById('security-error');
        errorElement.textContent = 'An error occurred. Please try again.';
        errorElement.setAttribute('data-error-status', 'error');
    });
});

function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('new-password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    
    function validatePassword() {
        const password = newPasswordInput.value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
        
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`${req}-req`);
            if (requirements[req]) {
                element.style.color = 'green';
            } else {
                element.style.color = 'red';
            }
        });
        
        return Object.values(requirements).every(req => req);
    }
    
    newPasswordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', function() {
        const errorElement = document.getElementById('password-error');
        if (this.value !== newPasswordInput.value) {
            errorElement.textContent = 'Passwords do not match.';
            errorElement.setAttribute('data-error-status', 'error');
        } else {
            errorElement.textContent = '';
            errorElement.setAttribute('data-error-status', 'normal');
        }
    });
}

// Submit new password
document.getElementById('submit-new-password')?.addEventListener('click', function() {
    const newPassword = document.getElementById('new-password-input').value;
    const confirmPassword = document.getElementById('confirm-password-input').value;
    const errorElement = document.getElementById('password-error');
    
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || 
        !/\d/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
        errorElement.textContent = 'Password does not meet requirements.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    // Submit password change
    this.disabled = true;
    this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Changing...';
    
    fetch('/change-password-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('new-password-modal').style.display = 'none';
            snackbar({
                type: "success",
                text: "Password changed successfully!",
                duration: "short"
            });
        } else {
            errorElement.textContent = data.message || 'Failed to change password.';
            errorElement.setAttribute('data-error-status', 'error');
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        errorElement.textContent = 'An error occurred while changing password.';
        errorElement.setAttribute('data-error-status', 'error');
    })
    .finally(() => {
        this.disabled = false;
        this.innerHTML = 'Change Password';
    });
});

// Modal close functionality
document.querySelectorAll('.close, #cancel-security, #cancel-password').forEach(element => {
    element.addEventListener('click', function() {
        document.getElementById('security-question-modal').style.display = 'none';
        document.getElementById('new-password-modal').style.display = 'none';
        
        // Reset forms
        const securityError = document.getElementById('security-error');
        const passwordError = document.getElementById('password-error');
        if (securityError) {
            securityError.textContent = '';
            securityError.setAttribute('data-error-status', 'normal');
        }
        if (passwordError) {
            passwordError.textContent = '';
            passwordError.setAttribute('data-error-status', 'normal');
        }
        
        document.querySelectorAll('.security-answer').forEach(input => input.value = '');
        document.getElementById('new-password-input').value = '';
        document.getElementById('confirm-password-input').value = '';
    });
});