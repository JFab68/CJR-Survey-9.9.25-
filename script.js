let currentStep = 1;
const totalSteps = 5;
const surveyPassword = "JusticeNow!"; // Master password

document.addEventListener('DOMContentLoaded', function() {
    // Password protection
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('password-input');
        const passwordError = document.getElementById('password-error');
        if (passwordInput.value === surveyPassword) {
            document.getElementById('password-protection').style.display = 'none';
            document.getElementById('survey-container').style.display = 'block';
            initializeSurvey();
        } else {
            passwordError.style.display = 'block';
            passwordInput.value = '';
        }
    });

    // Show/hide password
    const showPasswordCheckbox = document.getElementById('show-password');
    const passwordInput = document.getElementById('password-input');
    showPasswordCheckbox.addEventListener('change', function() {
        if (this.checked) {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    });
});

function initializeSurvey() {
    // Initialize the form
    updateProgress();
    setupConditionalFields();
    setupFormNavigation();
    showSection(currentStep);
    setupCheckboxStyles();
    updateSelectionInstructions();
    setupSelectionLimits();
    setupAutoSave();
    loadSurveyState();
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
    summaryContainer.innerHTML = '<h3>Your Selected Reform Ideas:</h3>'; // Reset content
    
    const selectedCheckboxes = document.querySelectorAll('input[name="reforms"]:checked');
    
    if (selectedCheckboxes.length === 0) {
        summaryContainer.innerHTML += '<p>You have not selected any reform ideas yet. Go back to make your selections.</p>';
        return;
    }

    const selectionsBySection = {};

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
    document.getElementById('surveyForm').addEventListener('submit', function(e) {
        // Prevent default only if we are handling it with JS
        // For Netlify, we want the default submission to happen
    });
}

function setupCheckboxStyles() {
    const checkboxLabels = document.querySelectorAll('.checkbox, .checkbox-with-specify');
    checkboxLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"], input[type="radio"]');
        if(checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.type === 'checkbox') {
                    if (this.checked) {
                        label.style.borderColor = '#3498db';
                        label.style.backgroundColor = '#e8f4fd';
                    } else {
                        label.style.borderColor = '#e9ecef';
                        label.style.backgroundColor = '#ffffff';
                    }
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

function validateCurrentStep() {
    if (currentStep === 1) {
        const roleCheckboxes = document.querySelectorAll('input[name="role"]:checked');
        if (roleCheckboxes.length === 0) {
            alert('Please select at least one role to continue.');
            return false;
        }
    }
    return true; 
}

function handleSubmit(e) {
    e.preventDefault();
    
    document.getElementById('surveyForm').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'block';
    
    const formData = new FormData(document.getElementById('surveyForm'));
    const formObject = Object.fromEntries(formData.entries());
    
    // Save final state before submission clears it
    saveSurveyState(true); 

    fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        localStorage.removeItem('surveyProgress'); // Clear saved progress
    })
    .catch((error) => {
        alert('Error submitting survey.');
        console.error(error);
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('surveyForm').style.display = 'block';
    });
}

// --- AutoSave and Load Logic ---
const storageKey = 'surveyProgress';

function saveSurveyState(isFinal = false) {
    const form = document.getElementById('surveyForm');
    const formData = new FormData(form);
    const formObject = {};
    for (const [key, value] of formData.entries()) {
        if (formObject[key]) {
            if (!Array.isArray(formObject[key])) {
                formObject[key] = [formObject[key]];
            }
            formObject[key].push(value);
        } else {
            formObject[key] = value;
        }
    }

    const surveyState = {
        step: currentStep,
        data: formObject,
        submitted: isFinal
    };
    
    localStorage.setItem(storageKey, JSON.stringify(surveyState));
}

function loadSurveyState() {
    const savedStateJSON = localStorage.getItem(storageKey);
    if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);

        if (savedState.submitted) {
            // If the user already submitted, show the success message
            document.getElementById('surveyForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            return;
        }
        
        currentStep = savedState.step || 1;
        const formData = savedState.data || {};
        
        // Populate form fields
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
                    element.value = value;
                }
            });
        }
        
        showSection(currentStep);
        updateProgress();
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

