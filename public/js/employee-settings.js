import {resetError, showError} from "./form.js";

const error_container = document.getElementById("form-employee-settings-error");

// Main Settings Form Handler
document.querySelector("#form-employee-settings").addEventListener("submit", function(e) {
    e.preventDefault();

    resetError(error_container);

    let input_employee_id = document.getElementById("input-settings-employee-id").value;
    let input_first_name = document.getElementById("input-settings-employee-fname");
    let input_last_name = document.getElementById("input-settings-employee-lname");
    let input_email = document.getElementById("input-settings-employee-email");
    let input_contact = document.getElementById("input-settings-employee-contact");

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

    let btn_save = document.getElementById("save-settings-btn");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/employee/settings", {
        employee_id: input_employee_id,
        fname: input_first_name.value,
        lname: input_last_name.value,
        email: input_email.value,
        contact: input_contact.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-save");
            btn_save.disabled = false;

            snackbar({
                type: "primary",
                text: "Employee settings updated successfully!"
            });
            setTimeout(function() {
                window.location.reload();
            }, 1500);
        }
    }).fail(function(data, status, xhr) {
        btn_save_icon.className = "";
        btn_save_icon.classList.add("fa", "fa-save");
        btn_save.disabled = false;

        if (data.responseJSON !== undefined) {
            showError(data.responseJSON.error, error_container);
        } else {
            snackbar({
                type: "error",
                text: "Error: Something went wrong while updating employee settings.",
                duration: "long"
            });
        }
    });
});

// Password Change Modal Functionality
const changePasswordBtn = document.getElementById('change-password-btn');

changePasswordBtn?.addEventListener('click', function() {
    // Check if employee has security questions set up
    fetch('/employee/check-security-questions')
    .then(response => response.json())
    .then(data => {
        if (data.hasQuestions) {
            // Load security questions and show modal
            loadSecurityQuestions();
        } else {
            // Show error that security questions are required
            showError('You need to set up security questions before you can change your password. Please use the "Manage Security Questions" button first.', error_container);
        }
    })
    .catch(error => {
        console.error('Error checking security questions:', error);
        showError('An error occurred. Please try again.', error_container);
    });
});

function loadSecurityQuestions() {
    // Get the logged-in employee's email from the form
    const userEmail = document.getElementById('input-settings-employee-email').value;
    
    const requestUrl = `/employee/security-questions?email=${encodeURIComponent(userEmail)}`;
    
    fetch(requestUrl)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const questions = [data.question1, data.question2].filter(q => q); // Filter out null questions
            displaySecurityQuestions(questions);
            document.getElementById('security-question-modal').style.display = 'block';
            document.getElementById('security-question-modal').classList.add('show');
            document.body.classList.add('modal-open');
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
    const container1 = document.getElementById('question1-container');
    const container2 = document.getElementById('question2-container');
    
    container1.style.display = 'none';
    container2.style.display = 'none';
    
    if (questions[0]) {
        container1.style.display = 'block';
        container1.querySelector('.mb-3').innerHTML = `
            <label class="form-label">${questions[0]}</label>
            <input type="text" class="form-control" id="security-answer1" placeholder="Enter your answer">
        `;
    }
    
    if (questions[1]) {
        container2.style.display = 'block';
        container2.querySelector('.mb-3').innerHTML = `
            <label class="form-label">${questions[1]}</label>
            <input type="text" class="form-control" id="security-answer2" placeholder="Enter your answer">
        `;
    }
}

// Security Questions Modal Event Listeners
document.getElementById('submit-security-answers')?.addEventListener('click', function() {
    const answer1Input = document.getElementById('security-answer1');
    const answer2Input = document.getElementById('security-answer2');
    const answer1 = answer1Input?.value.trim() || '';
    const answer2 = answer2Input?.value.trim() || '';
    
    if (!answer1 && !answer2) {
        const errorElement = document.getElementById('security-error');
        errorElement.textContent = 'Please answer at least one security question.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    // Verify security answers
    fetch('/employee/verify-security-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: document.getElementById('input-settings-employee-email').value,
            answer1: answer1,
            answer2: answer2 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeSecurityModal();
            showNewPasswordModal();
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

function closeSecurityModal() {
    const modal = document.getElementById('security-question-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // Clear form
    const answer1 = document.getElementById('security-answer1');
    const answer2 = document.getElementById('security-answer2');
    if (answer1) answer1.value = '';
    if (answer2) answer2.value = '';
    
    // Reset error
    const errorElement = document.getElementById('security-error');
    errorElement.textContent = '';
    errorElement.setAttribute('data-error-status', 'normal');
}

function showNewPasswordModal() {
    const modal = document.getElementById('new-password-modal');
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    setupPasswordValidation();
}

function closeNewPasswordModal() {
    const modal = document.getElementById('new-password-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // Clear form
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Reset error
    const errorElement = document.getElementById('password-error');
    errorElement.textContent = '';
    errorElement.setAttribute('data-error-status', 'normal');
}

function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    function validatePassword() {
        const password = newPasswordInput.value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password)
        };
        
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`${req}-req`);
            if (requirements[req]) {
                element.style.color = '#28a745';
                element.style.textDecoration = 'line-through';
            } else {
                element.style.color = 'red';
                element.style.textDecoration = 'none';
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
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('password-error');
    
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || 
        !/\d/.test(newPassword)) {
        errorElement.textContent = 'Password does not meet requirements.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    // Submit password change
    this.disabled = true;
    this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Updating...';
    
    fetch('/employee/change-password-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeNewPasswordModal();
            snackbar({
                type: "success",
                text: "Password changed successfully!"
            });
            // Reset button
            this.disabled = false;
            this.innerHTML = '<i class="fa fa-check"></i>Update Password';
        } else {
            errorElement.textContent = data.message || 'Failed to change password.';
            errorElement.setAttribute('data-error-status', 'error');
            // Reset button
            this.disabled = false;
            this.innerHTML = '<i class="fa fa-check"></i>Update Password';
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        errorElement.textContent = 'An error occurred. Please try again.';
        errorElement.setAttribute('data-error-status', 'error');
        // Reset button
        this.disabled = false;
        this.innerHTML = '<i class="fa fa-check"></i>Update Password';
    });
});

// Modal close handlers
document.getElementById('close-security-modal')?.addEventListener('click', closeSecurityModal);
document.getElementById('cancel-security')?.addEventListener('click', closeSecurityModal);
document.getElementById('close-password-modal')?.addEventListener('click', closeNewPasswordModal);
document.getElementById('cancel-password')?.addEventListener('click', closeNewPasswordModal);

// Security Questions Management
const changeSecurityQuestionsBtn = document.getElementById('change-security-questions-btn');

changeSecurityQuestionsBtn?.addEventListener('click', function() {
    // Load current security questions
    loadCurrentSecurityQuestions();
    const modal = document.getElementById('change-security-questions-modal');
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
});

function loadCurrentSecurityQuestions() {
    const userEmail = document.getElementById('input-settings-employee-email').value;
    
    fetch(`/employee/current-security-questions?email=${encodeURIComponent(userEmail)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Pre-populate the form with current questions
            if (data.question1) {
                document.getElementById('security-question-1').value = data.question1;
            }
            if (data.question2) {
                document.getElementById('security-question-2').value = data.question2;
            }
        }
    })
    .catch(error => {
        console.error('Error loading current security questions:', error);
    });
}

function closeSecurityQuestionsModal() {
    const modal = document.getElementById('change-security-questions-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // Clear form
    document.getElementById('security-question-1').value = '';
    document.getElementById('security-answer-1').value = '';
    document.getElementById('security-question-2').value = '';
    document.getElementById('security-answer-2').value = '';
    
    // Reset error
    const errorElement = document.getElementById('security-questions-error');
    errorElement.textContent = '';
    errorElement.setAttribute('data-error-status', 'normal');
}

// Save security questions
document.getElementById('save-security-questions')?.addEventListener('click', function() {
    const question1 = document.getElementById('security-question-1').value;
    const answer1 = document.getElementById('security-answer-1').value.trim();
    const question2 = document.getElementById('security-question-2').value;
    const answer2 = document.getElementById('security-answer-2').value.trim();
    const errorElement = document.getElementById('security-questions-error');
    
    if (!question1 && !question2) {
        errorElement.textContent = 'Please select at least one security question.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    if (question1 && !answer1) {
        errorElement.textContent = 'Please provide an answer for security question 1.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    if (question2 && !answer2) {
        errorElement.textContent = 'Please provide an answer for security question 2.';
        errorElement.setAttribute('data-error-status', 'error');
        return;
    }
    
    // Submit security questions
    this.disabled = true;
    this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';
    
    fetch('/employee/update-security-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            securityQuestion1: question1,
            securityAnswer1: answer1,
            securityQuestion2: question2,
            securityAnswer2: answer2
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeSecurityQuestionsModal();
            snackbar({
                type: "success",
                text: "Security questions updated successfully!"
            });
            // Reset button
            this.disabled = false;
            this.innerHTML = '<i class="fa fa-save"></i>Save Questions';
        } else {
            errorElement.textContent = data.message || 'Failed to update security questions.';
            errorElement.setAttribute('data-error-status', 'error');
            // Reset button
            this.disabled = false;
            this.innerHTML = '<i class="fa fa-save"></i>Save Questions';
        }
    })
    .catch(error => {
        console.error('Error updating security questions:', error);
        errorElement.textContent = 'An error occurred. Please try again.';
        errorElement.setAttribute('data-error-status', 'error');
        // Reset button
        this.disabled = false;
        this.innerHTML = '<i class="fa fa-save"></i>Save Questions';
    });
});

// Security questions modal close handlers
document.getElementById('close-change-security-modal')?.addEventListener('click', closeSecurityQuestionsModal);
document.getElementById('cancel-security-questions')?.addEventListener('click', closeSecurityQuestionsModal);