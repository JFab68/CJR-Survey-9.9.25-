let currentStep = 1;
const totalSteps = 5;

document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    setupConditionalFields();
    setupFormNavigation();
    showSection(currentStep);
    setupCheckboxStyles();
    updateSelectionInstructions();
    setupSelectionLimits();
    setupSelectionListeners();
});

function calculateLimit(n) {
    if (n <= 2) {
        return 1;
    } else if (n === 3) {
        return 2;
    } else if (n === 4) {
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
                        showError(group, `You may only select up to ${limit} option${limit > 1 ? 's' : ''} in this section.`);
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

function setupSelectionListeners() {
    const reformCheckboxes = document.querySelectorAll('input[name="reforms"]');
    reformCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (currentStep === 5) updateSelectionsSummary();
        });
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
}

function setupCheckboxStyles() {
    const checkboxLabels = document.querySelectorAll('.checkbox, .checkbox-with-specify');
    checkboxLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if(checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    label.style.borderColor = '#3498db';
                    label.style.backgroundColor = '#e8f4fd';
                } else {
                    label.style.borderColor = '#e9ecef';
                    label.style.backgroundColor = '#ffffff';
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
        currentSection.querySelector('h2').focus(); // Focus on section heading for accessibility
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
            updateSelectionsSummary(); // <-- Update summary when moving to final page
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
    const progressBar = document.querySelector('.progress-bar');
    
    const progressPercentage = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    progressBar.setAttribute('aria-valuenow', progressPercentage);
    
    currentStepSpan.textContent = currentStep;
    totalStepsSpan.textContent = totalSteps;
}

function validateCurrentStep() {
    if (currentStep === 1) {
        return validateSection1();
    }
    if (currentStep === 5) {
        return validateSection5();
    }
    return true; 
}

function validateSection1() {
    const roleCheckboxes = document.querySelectorAll('input[name="role"]:checked');
    
    if (roleCheckboxes.length === 0) {
        const group = document.querySelector('.section.active .checkbox-group');
        showError(group, 'Please select at least one role or connection to criminal justice reform.');
        return false;
    }
    
    return true;
}

function validateSection5() {
    const priorities = document.querySelectorAll('input[name^="priority"]');
    for (let i = 0; i < priorities.length; i++) {
        if (!priorities[i].value.trim()) {
            const group = priorities[i].closest('.priority-group');
            showError(group, `Please enter your ${i + 1}${getOrdinalSuffix(i + 1)} priority.`);
            priorities[i].focus();
            return false;
        }
    }
    return true;
}

function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

function showError(element, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--danger-color)';
    errorDiv.style.marginTop = '5px';
    errorDiv.setAttribute('role', 'alert');
    element.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    const form = document.getElementById('surveyForm');
    const formData = new FormData(form);

    document.getElementById('surveyForm').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'block';

    try {
        const response = await fetch(form.action || '/', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        } else {
            throw new Error('Form submission failed');
        }
    } catch (error) {
        showError(form, 'An error occurred while submitting the form. Please try again.');
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('surveyForm').style.display = 'block';
    }
}