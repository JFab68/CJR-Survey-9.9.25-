let currentStep = 1;
const totalSteps = 5;
let isAuthenticated = false;
let sessionToken = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check existing authentication
    checkAuthenticationStatus();
    
    // Password protection with server-side validation
    document.getElementById('password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('password-input');
        const passwordError = document.getElementById('password-error');
        
        try {
            const response = await authenticateUser(passwordInput.value);
            if (response.success) {
                sessionToken = response.token;
                isAuthenticated = true;
                localStorage.setItem('survey_auth_token', sessionToken);
                localStorage.setItem('survey_auth_expires', response.expires);
                
                document.getElementById('password-protection').style.display = 'none';
                document.getElementById('survey-container').style.display = 'block';
                initializeSurvey();
            } else {
                showError(passwordError, response.message || 'Invalid access code. Please try again.');
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Authentication error:', error);
            showError(passwordError, 'Authentication failed. Please try again.');
        }
    });

    // Show/hide password functionality
    const showPasswordCheckbox = document.getElementById('show-password');
    const passwordInputField = document.getElementById('password-input');
    
    if (showPasswordCheckbox && passwordInputField) {
        showPasswordCheckbox.addEventListener('change', function() {
            if (this.checked) {
                passwordInputField.type = 'text';
            } else {
                passwordInputField.type = 'password';
            }
        });
    } else {
        console.error('Show password elements not found:', {
            checkbox: showPasswordCheckbox,
            input: passwordInputField
        });
    }

    // Add navigation event listeners
    document.getElementById('prevBtn').addEventListener('click', () => changeStep(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changeStep(1));
});

async function initializeSurvey() {
    // Initialize the form
    updateProgress();
    setupConditionalFields();
    setupFormNavigation();
    showSection(currentStep);
    setupCheckboxStyles();
    updateSelectionInstructions();
    setupSelectionLimits();
    initializeTestMode();
    setupAutoSave();
    await loadSurveyState();
}

function calculateLimit(n) {
    if (n === 4) {
        return 3;
    }
    if (n <= 2) {
        return 1;
    } else if (n === 3) {
        return 2;
    } else { // n >= 5
        return 3;
    }
}


function updateSelectionInstructions() {
    const checkboxGroups = document.querySelectorAll('.checkbox-group.limit-selection');
    checkboxGroups.forEach(group => {
        const instructionP = group.parentElement.querySelector('.selection-instruction');
        if (!instructionP) return;

        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const n = checkboxes.length;
        const limit = calculateLimit(n);

        if (limit > 0 && n > 1) {
            instructionP.textContent = `Please select up to ${limit}.`;
            instructionP.style.display = 'block';
        } else {
             instructionP.style.display = 'none';
        }
    });
}

function setupSelectionLimits() {
    const checkboxGroups = document.querySelectorAll('.checkbox-group.limit-selection');
    checkboxGroups.forEach(group => {
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const n = checkboxes.length;
        const limit = calculateLimit(n);

        if (limit > 0) {
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (event) => {
                    const checkedInGroup = group.querySelectorAll('input[type="checkbox"]:checked');
                    
                    // Clear any existing error when a change is made
                    clearLimitError(group);

                    if (checkedInGroup.length > limit) {
                        showLimitError(group, `You may only select up to ${limit} option${limit > 1 ? 's' : ''} in this section.`);
                        event.target.checked = false;
                        const label = event.target.closest('label');
                        if (label) {
                            label.classList.remove('is-selected');
                        }
                    }
                });
            });
        }
    });
}

function showLimitError(group, message) {
    clearLimitError(group); // Remove any existing error first
    const errorElement = document.createElement('div');
    errorElement.className = 'limit-error-message';
    errorElement.textContent = message;
    group.prepend(errorElement); // Add it to the top of the group
}

function clearLimitError(group) {
    const existingError = group.querySelector('.limit-error-message');
    if (existingError) {
        existingError.remove();
    }
}

function updateSelectionsSummary() {
    const summaryContainer = document.getElementById('selectionsSummary');
    summaryContainer.innerHTML = '<h3>Your Selected Reform Ideas:</h3>'; // Reset content
    
    const selectedCheckboxes = document.querySelectorAll('input[name="reforms"]:checked');
    
    if (selectedCheckboxes.length === 0) {
        summaryContainer.innerHTML += '<p>You have not selected any reform ideas yet. Go back to make your selections.</p>';
        return;
    }

    const selectionsBySection = {};
    const allSelectionsForPriorities = [];

    selectedCheckboxes.forEach(checkbox => {
        const reformSection = checkbox.closest('.reform-section');
        if (!reformSection) return;

        const h3 = reformSection.querySelector('h3');
        const sectionTitle = h3 ? h3.textContent : 'Uncategorized';
        
        if (!selectionsBySection[sectionTitle]) {
            selectionsBySection[sectionTitle] = [];
        }

        const label = checkbox.closest('label');
        const labelClone = label.cloneNode(true);
        // Clean up the label text for display
        const specifyField = labelClone.querySelector('.specify-field');
        if (specifyField) specifyField.remove();
        const input = labelClone.querySelector('input');
        if(input) input.remove();
        
        let selectionText = labelClone.textContent.trim();

        // If it was a specify field, add the user's input
        if(checkbox.dataset.specify === 'true') {
            const originalSpecifyInput = label.querySelector('.specify-field input');
            if (originalSpecifyInput && originalSpecifyInput.value) {
                selectionText += `: ${originalSpecifyInput.value}`;
            }
        }
        
        // For summary list
        selectionsBySection[sectionTitle].push(selectionText);

        // For priority dropdowns
        allSelectionsForPriorities.push({
            value: checkbox.value,
            text: `${sectionTitle}: ${selectionText}`
        });
    });

    for (const sectionTitle in selectionsBySection) {
        const sectionDiv = document.createElement('div');
        const titleEl = document.createElement('h4');
        titleEl.textContent = sectionTitle;
        sectionDiv.appendChild(titleEl);

        const listEl = document.createElement('ul');
        selectionsBySection[sectionTitle].forEach(text => {
            const itemEl = document.createElement('li');
            itemEl.textContent = text;
            listEl.appendChild(itemEl);
        });
        sectionDiv.appendChild(listEl);
        summaryContainer.appendChild(sectionDiv);
    }

    // Populate priority dropdowns
    const priorityDropdowns = document.querySelectorAll('.priority-group select');
    const currentValues = Array.from(priorityDropdowns).map(sel => sel.value);

    priorityDropdowns.forEach(dropdown => {
        // Clear existing options but keep the first placeholder
        dropdown.innerHTML = '<option value="">-- Select a priority --</option>';
        
        allSelectionsForPriorities.forEach(selection => {
            const option = document.createElement('option');
            option.value = selection.value;
            option.textContent = selection.text;
            dropdown.appendChild(option);
        });
    });

    priorityDropdowns.forEach((dropdown, index) => {
        dropdown.value = currentValues[index] || "";
    });
}


function setupConditionalFields() {
    const checkboxesWithSpecify = document.querySelectorAll('input[type="checkbox"][data-specify="true"]');
    
    checkboxesWithSpecify.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('label');
            const specifyField = label.querySelector('.specify-field');
            
            if (specifyField) {
                if (this.checked) {
                    specifyField.style.display = 'block';
                    specifyField.style.opacity = '0';
                    specifyField.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        specifyField.style.transition = 'all 0.3s ease';
                        specifyField.style.opacity = '1';
                        specifyField.style.transform = 'translateY(0)';
                    }, 10);
                    
                    const input = specifyField.querySelector('input[type="text"]');
                    if (input) {
                        setTimeout(() => input.focus(), 300);
                    }
                } else {
                    specifyField.style.transition = 'all 0.3s ease';
                    specifyField.style.opacity = '0';
                    specifyField.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        specifyField.style.display = 'none';
                        const input = specifyField.querySelector('input[type="text"]');
                        if (input) input.value = '';
                    }, 300);
                }
            }
        });
    });
}

function setupFormNavigation() {
    document.getElementById('surveyForm').addEventListener('submit', handleSubmit);
    
    // Add real-time validation for key fields
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    const nameField = document.getElementById('name');
    
    if (emailField) {
        emailField.addEventListener('blur', validateEmailField);
    }
    if (phoneField) {
        phoneField.addEventListener('blur', validatePhoneField);
    }
    if (nameField) {
        nameField.addEventListener('input', validateNameField);
    }
    
    // Add validation for priority fields
    for (let i = 1; i <= 5; i++) {
        const priorityField = document.getElementById(`priority${i}`);
        if (priorityField) {
            priorityField.addEventListener('blur', () => validatePriorityFields());
        }
    }
}

function validateEmailField() {
    const emailField = document.getElementById('email');
    if (emailField.value.trim() && !ValidationRules.email.pattern.test(emailField.value)) {
        showFieldError(emailField, ValidationRules.email.message);
    } else {
        clearFieldError(emailField);
    }
}

function validatePhoneField() {
    const phoneField = document.getElementById('phone');
    if (phoneField.value.trim() && !ValidationRules.phone.pattern.test(phoneField.value)) {
        showFieldError(phoneField, ValidationRules.phone.message);
    } else {
        clearFieldError(phoneField);
    }
}

function validateNameField() {
    const nameField = document.getElementById('name');
    if (nameField.value.length > ValidationRules.name.maxLength) {
        showFieldError(nameField, ValidationRules.name.message);
    } else {
        clearFieldError(nameField);
    }
}

function validatePriorityFields() {
    const priorities = [];
    for (let i = 1; i <= 5; i++) {
        const priorityField = document.getElementById(`priority${i}`);
        const value = priorityField.value;
        
        clearFieldError(priorityField);
        
        if (value) {
            if (priorities.includes(value)) {
                showFieldError(priorityField, `Each priority must be unique.`);
            } else {
                priorities.push(value);
            }
        }
    }
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('is-invalid');
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = message;
    
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

function setupCheckboxStyles() {
    const checkboxLabels = document.querySelectorAll('.checkbox, .checkbox-with-specify');
    checkboxLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"], input[type="radio"]');
        if(checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.type === 'checkbox') {
                    label.classList.toggle('is-selected', this.checked);
                } else if (this.type === 'radio') {
                    // For radio buttons, remove class from all in the group then add to the selected one
                    document.querySelectorAll(`input[name="${this.name}"]`).forEach(radio => radio.closest('label').classList.remove('is-selected'));
                    label.classList.add('is-selected');
                }
            });
        }
    });
}

function showSection(step) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const currentSection = document.getElementById(`section${step}`);
    if (currentSection) {
        currentSection.classList.add('active');
    }
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
    
    if (step === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function changeStep(direction) {
    if (direction === 1 && !validateCurrentStep()) {
        return;
    }
    
    const newStep = currentStep + direction;
    
    if (newStep >= 1 && newStep <= totalSteps) {
        currentStep = newStep;
        if (newStep === 5) {
            updateSelectionsSummary();
        }
        showSection(currentStep);
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const currentStepSpan = document.getElementById('currentStep');
    const totalStepsSpan = document.getElementById('totalSteps');
    
    const progressPercentage = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    
    currentStepSpan.textContent = currentStep;
    totalStepsSpan.textContent = totalSteps;
}

// --- Form Validation System ---
const ValidationRules = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Please enter a valid email address"
    },
    phone: {
        pattern: /^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
        message: "Please enter a valid phone number"
    },
    name: {
        minLength: 2,
        maxLength: 100,
        message: "Name must be between 2 and 100 characters"
    },
    textField: {
        maxLength: 500,
        message: "Text must be less than 500 characters"
    },
    textarea: {
        maxLength: 2000,
        message: "Text must be less than 2000 characters"
    }
};

function validateCurrentStep() {
    clearValidationErrors();
    let isValid = true;
    const errors = [];
    
    switch (currentStep) {
        case 1:
            isValid = validateSection1(errors);
            break;
        case 2:
            isValid = validateSection2(errors);
            break;
        case 3:
            isValid = validateSection3(errors);
            break;
        case 4:
            isValid = validateSection4(errors);
            break;
        case 5:
            isValid = validateSection5(errors);
            break;
    }
    
    if (!isValid) {
        displayValidationErrors(errors);
        scrollToFirstError();
    }
    
    return isValid;
}

function validateSection1(errors) {
    let isValid = true;
    
    // Validate role selection
    const roleCheckboxes = document.querySelectorAll('input[name="role"]:checked');
    if (roleCheckboxes.length === 0) {
        errors.push({ field: 'role', message: 'Please select at least one role to continue.' });
        isValid = false;
    }
    
    // Validate conditional "specify" fields
    roleCheckboxes.forEach(checkbox => {
        if (checkbox.dataset.specify === 'true' && checkbox.checked) {
            const specifyField = checkbox.closest('label').querySelector('.specify-field input');
            if (specifyField && !specifyField.value.trim()) {
                errors.push({ 
                    field: specifyField.name, 
                    message: 'Please specify your role when "Other" is selected.' 
                });
                isValid = false;
            }
        }
    });
    
    // Validate optional email if provided
    const emailField = document.getElementById('email');
    if (emailField.value.trim() && !ValidationRules.email.pattern.test(emailField.value)) {
        errors.push({ field: 'email', message: ValidationRules.email.message });
        isValid = false;
    }
    
    // Validate optional phone if provided
    const phoneField = document.getElementById('phone');
    if (phoneField.value.trim() && !ValidationRules.phone.pattern.test(phoneField.value)) {
        errors.push({ field: 'phone', message: ValidationRules.phone.message });
        isValid = false;
    }
    
    // Validate name length if provided
    const nameField = document.getElementById('name');
    if (nameField.value.length > ValidationRules.name.maxLength) {
        errors.push({ field: 'name', message: ValidationRules.name.message });
        isValid = false;
    }
    
    return isValid;
}

function validateSection2(errors) {
    return validateReformSelections(errors, 'Section 2');
}

function validateSection3(errors) {
    return validateReformSelections(errors, 'Section 3');
}

function validateSection4(errors) {
    return validateReformSelections(errors, 'Section 4');
}

function validateSection5(errors) {
    let isValid = true;
    
    // Validate priority rankings
    const selectedPriorities = [];
    const priorityFields = [];
    for (let i = 1; i <= 5; i++) {
        priorityFields.push(document.getElementById(`priority${i}`));
    }

    priorityFields.forEach(field => {
        const value = field.value;
        if (value) {
            if (selectedPriorities.includes(value)) {
                errors.push({ 
                    field: field.id, 
                    message: `Each priority must be unique.` 
                });
                isValid = false;
            } else {
                selectedPriorities.push(value);
            }
        }
    });
    
    // Check if at least one priority is provided
    // Only require a priority if reforms were selected in previous steps
    const anyReformsSelected = document.querySelector('input[name="reforms"]:checked');

    if (anyReformsSelected && selectedPriorities.length === 0) {
        errors.push({ 
            field: 'priority1', 
            message: 'Please rank at least one of your selected reforms.' 
        });
        isValid = false;
    }
    
    // Validate additional input length
    const additionalInput = document.getElementById('additional_input');
    if (additionalInput.value.length > ValidationRules.textarea.maxLength) {
        errors.push({ field: 'additional_input', message: ValidationRules.textarea.message });
        isValid = false;
    }
    
    // Validate contact permission selection
    const contactPermission = document.querySelector('input[name="contact_permission"]:checked');
    if (!contactPermission) {
        errors.push({ 
            field: 'contact_permission', 
            message: 'Please indicate whether you allow follow-up contact.' 
        });
        isValid = false;
    }
    
    return isValid;
}

function validateReformSelections(errors, sectionName) {
    const currentSection = document.querySelector('.section.active');
    const reformCheckboxes = currentSection.querySelectorAll('input[name="reforms"]:checked');
    
    // Validate conditional "specify" fields for selected reforms
    reformCheckboxes.forEach(checkbox => {
        if (checkbox.dataset.specify === 'true') {
            const specifyField = checkbox.closest('label').querySelector('.specify-field input');
            if (specifyField && !specifyField.value.trim()) {
                errors.push({ 
                    field: specifyField.name, 
                    message: 'Please specify details when "Other" is selected.' 
                });
                return false;
            }
        }
    });
    
    return true; // Reform selections are optional
}

function clearValidationErrors() {
    // Remove existing error displays
    document.querySelectorAll('.invalid-feedback').forEach(error => error.remove());
    document.querySelectorAll('.is-invalid').forEach(field => field.classList.remove('is-invalid'));
}

function displayValidationErrors(errors) {
    errors.forEach(error => {
        const field = document.getElementById(error.field) || 
                     document.querySelector(`[name="${error.field}"]`);
        if (field) {
            // Add error styling to field
            const fieldToStyle = (field.type === 'radio' || field.type === 'checkbox') ? field.closest('.form-group') : field;
            fieldToStyle.classList.add('is-invalid');
            
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            errorElement.textContent = error.message;
            
            // Insert error message after the field
            if (field.type === 'radio' || field.type === 'checkbox') {
                const container = field.closest('.checkbox-group') || field.closest('.form-group');
                if (container) {
                    container.appendChild(errorElement);
                }
            } else {
                field.parentNode.insertBefore(errorElement, field.nextSibling);
            }
        }
    });
}

function scrollToFirstError() {
    const firstError = document.querySelector('.invalid-feedback');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

let isSubmitting = false; // Prevent duplicate submissions

function handleSubmit(e) {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
        return false;
    }
    
    // Final validation before submission
    if (!validateCurrentStep()) {
        return false;
    }
    
    // Validate authentication
    if (!isAuthenticated || !sessionToken) {
        showError(document.getElementById('password-error'), 'Session expired. Please log in again.');
        document.getElementById('password-protection').style.display = 'block';
        document.getElementById('survey-container').style.display = 'none';
        return false;
    }
    
    isSubmitting = true;
    
    document.getElementById('surveyForm').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'block';
    
    const formData = new FormData(document.getElementById('surveyForm'));
    
    // Sanitize all form data before submission
    const sanitizedData = validateAndSanitizeFormData(formData);
    
    // Add authentication token and timestamp
    sanitizedData.sessionToken = sessionToken;
    sanitizedData.submissionTime = new Date().toISOString();
    
    // Save final state before submission clears it
    saveSurveyState(true); 

    fetch("/", {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Survey-Token": sessionToken // Add auth header
        },
        body: new URLSearchParams(sanitizedData).toString()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
    })
    .then(async () => {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        // Clear all sensitive data
        await secureStorage.removeItem(storageKey);
        localStorage.removeItem('survey_auth_token');
        localStorage.removeItem('survey_auth_expires');
        localStorage.removeItem('survey_encryption_key'); // Clear encryption key
        localStorage.removeItem(storageKey + '_backup'); // Clear backup data
        isSubmitting = false;
    })
    .catch((error) => {
        console.error('Survey submission error:', error);
        
        // Show user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'submission-error';
        errorContainer.style.cssText = `
            background-color: #ffebee;
            border: 1px solid #e74c3c;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        `;
        errorContainer.innerHTML = `
            <strong>Submission Failed</strong><br>
            There was an error submitting your survey. Please try again.<br>
            If the problem persists, please contact support.
        `;
        
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('surveyForm').style.display = 'block';
        document.getElementById('surveyForm').insertBefore(errorContainer, document.getElementById('surveyForm').firstChild);
        
        // Auto-remove error after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 10000);
        
        isSubmitting = false;
    });
}

// --- Authentication and Security Functions ---
async function authenticateUser(password) {
    try {
        // This endpoint should be a serverless function (e.g., a Netlify Function)
        // that securely validates the password against a stored secret.
        const response = await fetch('/.netlify/functions/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // The server should provide a user-friendly error message.
            return { success: false, message: data.message || 'Authentication failed.' };
        }

        // The server returns a token and expiry on success.
        return {
            success: true,
            token: data.token,
            expires: data.expires,
        };
    } catch (error) {
        console.error('Network or server error during authentication:', error);
        return { success: false, message: 'Could not connect to the authentication service. Please try again later.' };
    }
}

function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function checkAuthenticationStatus() {
    const token = localStorage.getItem('survey_auth_token');
    const expires = localStorage.getItem('survey_auth_expires');
    
    if (token && expires && Date.now() < parseInt(expires)) {
        sessionToken = token;
        isAuthenticated = true;
        document.getElementById('password-protection').style.display = 'none';
        document.getElementById('survey-container').style.display = 'block';
        initializeSurvey();
    } else {
        // Clear expired authentication
        localStorage.removeItem('survey_auth_token');
        localStorage.removeItem('survey_auth_expires');
        isAuthenticated = false;
        sessionToken = null;
    }
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    element.style.color = '#e74c3c';
    element.style.fontWeight = 'bold';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// --- Input Sanitization Functions ---
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters and scripts
    return input
        .replace(/[<>"'&]/g, function(match) {
            const escape = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return escape[match];
        })
        .trim();
}

function validateAndSanitizeFormData(formData) {
    const sanitizedData = {};
    
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            sanitizedData[key] = sanitizeInput(value);
        } else {
            sanitizedData[key] = value;
        }
    }
    
    return sanitizedData;
}

// --- Data Encryption for localStorage ---
class SecureStorage {
    constructor() {
        this.encryptionKey = null;
        this.initEncryption();
    }
    
    async initEncryption() {
        try {
            // Generate or retrieve encryption key
            let keyData = localStorage.getItem('survey_encryption_key');
            if (!keyData) {
                // Generate new key
                const key = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                
                // Export and store key
                const exportedKey = await crypto.subtle.exportKey('raw', key);
                keyData = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
                localStorage.setItem('survey_encryption_key', keyData);
            }
            
            // Import key for use
            const keyBytes = new Uint8Array(keyData.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            this.encryptionKey = await crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.warn('Encryption not available, using plain text storage:', error);
            this.encryptionKey = null;
        }
    }
    
    async encryptData(data) {
        if (!this.encryptionKey) {
            return JSON.stringify(data); // Fallback to plain text
        }
        
        try {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encodedData = new TextEncoder().encode(JSON.stringify(data));
            
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encodedData
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);
            
            // Convert to hex string
            return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('Encryption failed, using plain text:', error);
            return JSON.stringify(data);
        }
    }
    
    async decryptData(encryptedHex) {
        if (!this.encryptionKey) {
            try {
                return JSON.parse(encryptedHex); // Fallback for plain text
            } catch {
                return null;
            }
        }
        
        try {
            // Convert hex to bytes
            const combined = new Uint8Array(encryptedHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encryptedData = combined.slice(12);
            
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encryptedData
            );
            
            const decryptedText = new TextDecoder().decode(decryptedData);
            return JSON.parse(decryptedText);
        } catch (error) {
            console.warn('Decryption failed:', error);
            try {
                return JSON.parse(encryptedHex); // Try as plain text fallback
            } catch {
                return null;
            }
        }
    }
    
    async setItem(key, data) {
        const encryptedData = await this.encryptData(data);
        localStorage.setItem(key, encryptedData);
    }
    
    async getItem(key) {
        const encryptedData = localStorage.getItem(key);
        if (!encryptedData) return null;
        return await this.decryptData(encryptedData);
    }
    
    async removeItem(key) {
        localStorage.removeItem(key);
    }
}

// Initialize secure storage
const secureStorage = new SecureStorage();

// --- AutoSave and Load Logic ---
const storageKey = 'surveyProgress';

async function saveSurveyState(isFinal = false) {
    if (!isAuthenticated) return; // Don't save if not authenticated
    
    const form = document.getElementById('surveyForm');
    const formData = new FormData(form);
    const formObject = {};
    
    // Sanitize data before saving
    for (const [key, value] of formData.entries()) {
        const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
        if (formObject[key]) {
            if (!Array.isArray(formObject[key])) {
                formObject[key] = [formObject[key]];
            }
            formObject[key].push(sanitizedValue);
        } else {
            formObject[key] = sanitizedValue;
        }
    }

    const surveyState = {
        step: currentStep,
        data: formObject,
        submitted: isFinal,
        lastSaved: Date.now(),
        sessionToken: sessionToken // Include for validation
    };
    
    try {
        await secureStorage.setItem(storageKey, surveyState);
    } catch (error) {
        console.warn('Failed to save survey state:', error);
        // Fallback to unencrypted storage as last resort
        localStorage.setItem(storageKey + '_backup', JSON.stringify(surveyState));
    }
}

async function loadSurveyState() {
    if (!isAuthenticated) return; // Don't load if not authenticated
    
    try {
        const savedState = await secureStorage.getItem(storageKey);
        
        if (savedState) {
            // Validate session token matches
            if (savedState.sessionToken && savedState.sessionToken !== sessionToken) {
                console.warn('Session token mismatch, clearing saved state');
                await secureStorage.removeItem(storageKey);
                return;
            }
            
            // Check if data is too old (7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            if (savedState.lastSaved && (Date.now() - savedState.lastSaved) > maxAge) {
                console.warn('Saved state is too old, clearing');
                await secureStorage.removeItem(storageKey);
                return;
            }

            if (savedState.submitted) {
                // If the user already submitted, show the success message
                document.getElementById('surveyForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                return;
            }
            
            currentStep = savedState.step || 1;
            const formData = savedState.data || {};
            
            // Populate form fields with sanitized data
            for (const key in formData) {
                const elements = document.querySelectorAll(`[name="${key}"]`);
                elements.forEach(element => {
                    const value = formData[key];
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        if (Array.isArray(value)) {
                            element.checked = value.includes(element.value);
                        } else {
                            element.checked = (element.value === value);
                        }
                        // Trigger change to update styles and conditional fields
                        if(element.checked) {
                            element.dispatchEvent(new Event('change'));
                        }
                    } else {
                        element.value = value || '';
                    }
                });
            }
            
            showSection(currentStep);
            updateProgress();
        }
    } catch (error) {
        console.warn('Failed to load survey state:', error);
        
        // Try fallback backup storage
        try {
            const backupState = localStorage.getItem(storageKey + '_backup');
            if (backupState) {
                const parsedBackup = JSON.parse(backupState);
                console.warn('Using backup survey state');
                // Process backup state similar to above...
            }
        } catch (backupError) {
            console.warn('Backup state also failed to load:', backupError);
        }
    }
}

function setupAutoSave() {
    const form = document.getElementById('surveyForm');
    form.addEventListener('change', () => saveSurveyState());
    form.addEventListener('keyup', () => saveSurveyState());
    document.querySelectorAll('.navigation button').forEach(button => {
        button.addEventListener('click', () => saveSurveyState());
    });
}

function initializeTestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
        const modeInput = document.getElementById('submission_mode');
        if (modeInput) {
            modeInput.value = 'test';
        }

        // Add a visual indicator to the header
        const header = document.querySelector('.survey-header h1');
        if (header) {
            const testIndicator = document.createElement('span');
            testIndicator.textContent = ' [TEST MODE]';
            testIndicator.style.color = 'var(--danger-color)';
            header.appendChild(testIndicator);
        }
    }
}
