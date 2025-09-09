let currentStep = 1;
const totalSteps = 5;
const masterPassword = 'JusticeNow!'; // The master password
const surveyStorageKey = 'cjReformSurveyProgress';

document.addEventListener('DOMContentLoaded', function() {
    // Password protection logic
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const passwordInput = document.getElementById('password-input');
            const passwordError = document.getElementById('password-error');
            if (passwordInput.value === masterPassword) {
                document.getElementById('password-protection').style.display = 'none';
                document.getElementById('survey-container').style.display = 'block';
                sessionStorage.setItem('surveyAuthenticated', 'true');
                initializeSurvey();
            } else {
                passwordError.style.display = 'block';
            }
        });
    }

    // Check if user is already authenticated (e.g., via session storage)
    if (sessionStorage.getItem('surveyAuthenticated') === 'true') {
        document.getElementById('password-protection').style.display = 'none';
        document.getElementById('survey-container').style.display = 'block';
        initializeSurvey();
    }
});

function initializeSurvey() {
    loadProgress();
    updateProgress();
    setupConditionalFields();
    setupFormNavigation();
    showSection(currentStep);
    setupCheckboxStyles();
    updateSelectionInstructions();
    setupSelectionLimits();
    setupAutoSave();
}

function calculateLimit(n) {
    if (n <= 2) return 1;
    if (n === 3 || n === 4) return 2;
    return 3;
}

function updateSelectionInstructions() {
    document.querySelectorAll('.checkbox-group.limit-selection').forEach(group => {
        const instructionP = group.parentElement.querySelector('.selection-instruction');
        if (!instructionP) return;
        const n = group.querySelectorAll('input[type="checkbox"]').length;
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
    document.querySelectorAll('.checkbox-group.limit-selection').forEach(group => {
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const n = checkboxes.length;
        const limit = calculateLimit(n);
        if (limit > 0 && n > 1) {
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (event) => {
                    const checkedInGroup = group.querySelectorAll('input[type="checkbox"]:checked');
                    if (checkedInGroup.length > limit) {
                        alert(`You may only select up to ${limit} option${limit > 1 ? 's' : ''} in this section.`);
                        event.target.checked = false;
                        const label = event.target.closest('label');
                        if (label) {
                            label.style.borderColor = '#e9ecef';
                            label.style.backgroundColor = '#ffffff';
                        }
                    }
                });
            });
        }
    });
}

function updateSelectionsSummary() {
    const summaryContainer = document.getElementById('selectionsSummary');
    summaryContainer.innerHTML = '<h3>Your Selected Reform Ideas:</h3>';
    const selectedCheckboxes = document.querySelectorAll('input[name="reforms"]:checked');
    if (selectedCheckboxes.length === 0) {
        summaryContainer.innerHTML += '<p>You have not selected any reform ideas yet. Go back to make your selections.</p>';
        return;
    }
    const selectionsBySection = {};
    selectedCheckboxes.forEach(checkbox => {
        const reformSection = checkbox.closest('.reform-section');
        if (!reformSection) return;
        let sectionTitle = 'Uncategorized';
        const h4 = reformSection.querySelector('h4');
        const h3 = reformSection.querySelector('h3');
        if (h4) {
           sectionTitle = h3.textContent + ' - ' + h4.textContent;
        } else if (h3) {
           sectionTitle = h3.textContent;
        }
        if (!selectionsBySection[sectionTitle]) {
            selectionsBySection[sectionTitle] = [];
        }
        const label = checkbox.closest('label');
        const labelClone = label.cloneNode(true);
        const specifyField = labelClone.querySelector('.specify-field');
        if (specifyField) specifyField.remove();
        const input = labelClone.querySelector('input');
        if(input) input.remove();
        let selectionText = labelClone.textContent.trim();
        if(checkbox.dataset.specify === 'true') {
            const originalSpecifyInput = label.querySelector('.specify-field input');
            if (originalSpecifyInput && originalSpecifyInput.value) {
                selectionText += `: ${originalSpecifyInput.value}`;
            }
        }
        selectionsBySection[sectionTitle].push(selectionText);
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
}

function setupConditionalFields() {
    document.querySelectorAll('input[type="checkbox"][data-specify="true"]').forEach(checkbox => {
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
    document.getElementById('surveyForm').addEventListener('submit', function(e) {
        // We let Netlify handle the submission, but we clear progress on submit
        localStorage.removeItem(surveyStorageKey);
        sessionStorage.removeItem('surveyAuthenticated'); // Log out on submission
    });
}

function setupCheckboxStyles() {
    document.querySelectorAll('.checkbox, .checkbox-with-specify').forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"], input[type="radio"]');
        if(checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    label.style.borderColor = '#3498db';
                    label.style.backgroundColor = '#e8f4fd';
                } else if (this.type === 'checkbox') {
                    label.style.borderColor = '#e9ecef';
                    label.style.backgroundColor = '#ffffff';
                }
            });
            // Initial style for radio buttons
            if (checkbox.checked) {
                 label.style.borderColor = '#3498db';
                 label.style.backgroundColor = '#e8f4fd';
            }
        }
    });
}

function showSection(step) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
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
        saveProgress();
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

function validateCurrentStep() {
    if (currentStep === 1) {
        return validateSection1();
    }
    return true; 
}

function validateSection1() {
    const roleCheckboxes = document.querySelectorAll('input[name="role"]:checked');
    if (roleCheckboxes.length === 0) {
        alert('Please select at least one role or connection to criminal justice reform.');
        return false;
    }
    return true;
}

// --- SESSION & PROGRESS SAVING ---

function saveProgress() {
    const formData = new FormData(document.getElementById('surveyForm'));
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    data.currentStep = currentStep;
    localStorage.setItem(surveyStorageKey, JSON.stringify(data));
}

function loadProgress() {
    const savedData = localStorage.getItem(surveyStorageKey);
    if (savedData) {
        const data = JSON.parse(savedData);
        currentStep = data.currentStep || 1;
        const form = document.getElementById('surveyForm');
        for (const key in data) {
            if (key !== 'currentStep') {
                const inputs = form.querySelectorAll(`[name="${key}"]`);
                inputs.forEach(input => {
                    const value = data[key];
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        if (Array.isArray(value)) {
                            input.checked = value.includes(input.value);
                        } else {
                            input.checked = input.value === value;
                        }
                        // Trigger change to update styles and conditional fields
                        if (input.checked) {
                            input.dispatchEvent(new Event('change'));
                        }
                    } else {
                        input.value = value;
                    }
                });
            }
        }
    }
}

function setupAutoSave() {
    const form = document.getElementById('surveyForm');
    form.addEventListener('change', saveProgress);
    form.addEventListener('keyup', saveProgress);
}

