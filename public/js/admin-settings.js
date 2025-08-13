import {resetError, showError} from "./form.js";

const error_container = document.getElementById("form-admin-settings-error");

// Main Settings Form Handler
document.querySelector("#form-admin-settings").addEventListener("submit", function(e) {
    e.preventDefault();

    resetError(error_container);

    let input_admin_id = document.getElementById("input-settings-admin-id").value;
    let input_username = document.getElementById("input-settings-admin-username");

    if (input_username.value === "") {
        showError("Please enter a username.", error_container);
        input_username.focus();
        return;
    }

    let btn_save = document.getElementById("save-settings-btn");
    btn_save.disabled = true;

    let btn_save_icon = btn_save.querySelector("i");
    btn_save_icon.className = "";
    btn_save_icon.classList.add("spinner-border", "me-2");

    $.post("/admin/settings", {
        admin_id: input_admin_id,
        username: input_username.value
    }, (data, status, xhr) => {
        if (status === "success" && xhr.status === 200) {
            btn_save_icon.className = "";
            btn_save_icon.classList.add("fa", "fa-save");
            btn_save.disabled = false;

            snackbar({
                type: "primary",
                text: "Admin settings updated successfully!"
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
                text: "Error: Something went wrong while updating admin settings.",
                duration: "long"
            });
        }
    });
});

// Password Change Modal Functionality
const changePasswordBtn = document.getElementById('change-password-btn');

changePasswordBtn?.addEventListener('click', function() {
    // Check if admin has security questions set up
    fetch('/admin/settings/security-questions')
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
        showError('Error checking security questions setup.', error_container);
    });
});

function loadSecurityQuestions() {
    fetch('/admin/settings/security-questions')
    .then(response => response.json())
    .then(data => {
        if (data.securityQuestion1 && data.securityQuestion2) {
            document.getElementById('security-question1-text').textContent = data.securityQuestion1;
            document.getElementById('security-question2-text').textContent = data.securityQuestion2;
            document.getElementById('question1-container').style.display = 'block';
            document.getElementById('question2-container').style.display = 'block';
            
            // Show the security questions modal
            const securityModal = document.getElementById('security-question-modal');
            securityModal.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error loading security questions:', error);
        showError('Error loading security questions.', error_container);
    });
}

// Security Questions Modal Event Handlers
document.getElementById('close-security-modal')?.addEventListener('click', function() {
    closeSecurityModal();
});

document.getElementById('cancel-security')?.addEventListener('click', function() {
    closeSecurityModal();
});

function closeSecurityModal() {
    const modal = document.getElementById('security-question-modal');
    modal.style.display = 'none';
    // Clear inputs
    document.getElementById('security-answer1').value = '';
    document.getElementById('security-answer2').value = '';
    const securityError = document.getElementById('security-error');
    resetError(securityError);
}

document.getElementById('submit-security-answers')?.addEventListener('click', function() {
    const answer1 = document.getElementById('security-answer1').value;
    const answer2 = document.getElementById('security-answer2').value;
    const securityError = document.getElementById('security-error');
    
    resetError(securityError);
    
    if (!answer1 || !answer2) {
        showError('Please answer both security questions.', securityError);
        return;
    }
    
    // Verify security answers
    fetch('/admin/settings/security-answers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            answer1: answer1,
            answer2: answer2
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.verified) {
            closeSecurityModal();
            showPasswordModal();
        } else {
            showError(data.error || 'Security answers are incorrect.', securityError);
        }
    })
    .catch(error => {
        console.error('Error verifying security answers:', error);
        showError('Error verifying security answers.', securityError);
    });
});

function showPasswordModal() {
    const passwordModal = document.getElementById('new-password-modal');
    passwordModal.style.display = 'block';
}

// Password Modal Event Handlers
document.getElementById('close-password-modal')?.addEventListener('click', function() {
    closePasswordModal();
});

document.getElementById('cancel-password')?.addEventListener('click', function() {
    closePasswordModal();
});

function closePasswordModal() {
    const modal = document.getElementById('new-password-modal');
    modal.style.display = 'none';
    // Clear inputs
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    const passwordError = document.getElementById('password-error');
    resetError(passwordError);
}

document.getElementById('submit-new-password')?.addEventListener('click', function() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const passwordError = document.getElementById('password-error');
    
    resetError(passwordError);
    
    if (!newPassword || !confirmPassword) {
        showError('Please fill in both password fields.', passwordError);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match.', passwordError);
        return;
    }
    
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters long.', passwordError);
        return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
        showError('Password must contain at least one uppercase letter.', passwordError);
        return;
    }
    
    if (!/[a-z]/.test(newPassword)) {
        showError('Password must contain at least one lowercase letter.', passwordError);
        return;
    }
    
    if (!/[0-9]/.test(newPassword)) {
        showError('Password must contain at least one number.', passwordError);
        return;
    }
    
    // Submit password change
    fetch('/admin/change-password-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            newPassword: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closePasswordModal();
            snackbar({
                type: "primary",
                text: "Password changed successfully!"
            });
        } else {
            showError(data.error || 'Error changing password.', passwordError);
        }
    })
    .catch(error => {
        console.error('Error changing password:', error);
        showError('Error changing password.', passwordError);
    });
});

// Security Questions Management
const changeSecurityQuestionsBtn = document.getElementById('change-security-questions-btn');

changeSecurityQuestionsBtn?.addEventListener('click', function() {
    loadSecurityQuestionsOptions();
    const modal = document.getElementById('change-security-questions-modal');
    modal.style.display = 'block';
});

function loadSecurityQuestionsOptions() {
    const questions = [
        "What was the name of your first pet?",
        "What is your mother's maiden name?",
        "What was the name of your elementary school?",
        "What is the name of the city where you were born?",
        "What was your favorite food as a child?",
        "What is your favorite movie?",
        "What was the make of your first car?",
        "What is your favorite color?"
    ];
    
    const select1 = document.getElementById('security-question-1');
    const select2 = document.getElementById('security-question-2');
    
    // Clear existing options
    select1.innerHTML = '<option value="">Select a question...</option>';
    select2.innerHTML = '<option value="">Select a question...</option>';
    
    // Add question options
    questions.forEach(question => {
        const option1 = document.createElement('option');
        option1.value = question;
        option1.textContent = question;
        select1.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = question;
        option2.textContent = question;
        select2.appendChild(option2);
    });
}

// Security Questions Modal Event Handlers
document.getElementById('close-change-security-modal')?.addEventListener('click', function() {
    closeChangeSecurityModal();
});

document.getElementById('cancel-security-questions')?.addEventListener('click', function() {
    closeChangeSecurityModal();
});

function closeChangeSecurityModal() {
    const modal = document.getElementById('change-security-questions-modal');
    modal.style.display = 'none';
    // Clear form
    document.getElementById('security-questions-form').reset();
    const securityError = document.getElementById('security-questions-error');
    resetError(securityError);
}

document.getElementById('save-security-questions')?.addEventListener('click', function() {
    const question1 = document.getElementById('security-question-1').value;
    const answer1 = document.getElementById('security-answer-1').value;
    const question2 = document.getElementById('security-question-2').value;
    const answer2 = document.getElementById('security-answer-2').value;
    const securityError = document.getElementById('security-questions-error');
    
    resetError(securityError);
    
    if (!question1 || !answer1 || !question2 || !answer2) {
        showError('Please fill in all fields.', securityError);
        return;
    }
    
    if (question1 === question2) {
        showError('Please select different questions.', securityError);
        return;
    }
    
    // Save security questions
    fetch('/admin/update-security-questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question1: question1,
            answer1: answer1,
            question2: question2,
            answer2: answer2
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeChangeSecurityModal();
            snackbar({
                type: "primary",
                text: "Security questions updated successfully!"
            });
        } else {
            showError(data.error || 'Error updating security questions.', securityError);
        }
    })
    .catch(error => {
        console.error('Error updating security questions:', error);
        showError('Error updating security questions.', securityError);
    });
});