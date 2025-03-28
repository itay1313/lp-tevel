// Form validation and step handling
function showError(input, message) {
  const formGroup = input.closest('.form-group');
  const errorDiv = formGroup.querySelector('.error-message') || document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  if (!formGroup.querySelector('.error-message')) {
    formGroup.appendChild(errorDiv);
  }
  input.classList.add('error');
}

function removeError(input) {
  const formGroup = input.closest('.form-group');
  const errorDiv = formGroup.querySelector('.error-message');
  if (errorDiv) {
    errorDiv.remove();
  }
  input.classList.remove('error');
}

function validateStep(stepNumber) {
  const step = document.getElementById(`step${stepNumber}`);
  const requiredInputs = step.querySelectorAll('input[required]');
  let isValid = true;

  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      showError(input, 'שדה חובה');
      isValid = false;
    } else {
      removeError(input);

      // Validate email format
      if (input.type === 'email' && !/\S+@\S+\.\S+/.test(input.value)) {
        showError(input, 'כתובת אימייל לא תקינה');
        isValid = false;
      }

      // Validate phone number format
      if (input.name === 'PhoneNumber1_countrycode' && !/^\d{3}-?\d{7}$/.test(input.value)) {
        showError(input, 'מספר טלפון לא תקין');
        isValid = false;
      }
    }
  });

  return isValid;
}

function updateProgressBar(currentStep) {
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, index) => {
    if (index + 1 < currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (index + 1 === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

function nextStep(currentStep) {
  if (!validateStep(currentStep)) {
    return;
  }

  const currentStepElement = document.getElementById(`step${currentStep}`);
  const nextStepElement = document.getElementById(`step${currentStep + 1}`);

  if (currentStepElement && nextStepElement) {
    currentStepElement.classList.remove('active');
    nextStepElement.classList.add('active');
    updateProgressBar(currentStep + 1);

    // Smooth scroll to top of form
    const formContainer = document.querySelector('.form-container');
    formContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function prevStep(currentStep) {
  const currentStepElement = document.getElementById(`step${currentStep}`);
  const prevStepElement = document.getElementById(`step${currentStep - 1}`);

  if (currentStepElement && prevStepElement) {
    currentStepElement.classList.remove('active');
    prevStepElement.classList.add('active');
    updateProgressBar(currentStep - 1);

    // Smooth scroll to top of form
    const formContainer = document.querySelector('.form-container');
    formContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

// Form submission handling
document.getElementById('tevelForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!validateStep(3)) {
    return;
  }

  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> שולח...';
  submitBtn.disabled = true;

  try {
    const formData = new FormData(this);
    const response = await fetch(this.action, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      showMessage('הטופס נשלח בהצלחה! נציג יצור איתך קשר בהקדם.', 'success');
      this.reset();
      document.getElementById('step1').classList.add('active');
      document.getElementById('step3').classList.remove('active');
      updateProgressBar(1);
    } else {
      throw new Error('שגיאה בשליחת הטופס');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message ${type}`;
  messageDiv.textContent = message;

  const formContainer = document.querySelector('.form-container');
  formContainer.insertBefore(messageDiv, formContainer.firstChild);

  setTimeout(() => messageDiv.remove(), 5000);
}

// Popup handling
function showPopup() {
  document.getElementById('consentPopup').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  document.getElementById('consentPopup').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Add click event to consent checkbox label
document.querySelector('.consent-checkbox label').addEventListener('click', function (e) {
  e.preventDefault();
  showPopup();
});

function validateFileUpload(input, maxSizeMB) {
  const uploadArea = input.closest('.upload-area');
  const errorElement = uploadArea.querySelector('.upload-error') || document.createElement('div');

  if (!errorElement.classList.contains('upload-error')) {
    errorElement.className = 'upload-error';
    uploadArea.appendChild(errorElement);
  }

  // Reset previous errors
  uploadArea.classList.remove('error');
  errorElement.textContent = '';

  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];

  const files = Array.from(input.files);

  for (const file of files) {
    // Check file size
    if (file.size > maxSizeBytes) {
      uploadArea.classList.add('error');
      errorElement.textContent = `הקובץ ${file.name} גדול מ-${maxSizeMB}MB`;
      input.value = ''; // Clear the input
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      uploadArea.classList.add('error');
      errorElement.textContent = `סוג הקובץ ${fileExtension} אינו נתמך`;
      input.value = ''; // Clear the input
      return false;
    }
  }

  return true;
}

function handleFileUpload(input, previewId) {
  const previewDiv = document.getElementById(previewId);
  previewDiv.innerHTML = '';

  if (input.files && input.files.length > 0) {
    previewDiv.classList.add('has-files');

    Array.from(input.files).forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';

      const fileSize = (file.size / (1024 * 1024)).toFixed(2);

      fileItem.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>${file.name} (${fileSize} MB)</span>
                <span class="remove-file" onclick="removeFile(this, '${input.id}', '${previewId}')">×</span>
            `;

      previewDiv.appendChild(fileItem);
    });
  } else {
    previewDiv.classList.remove('has-files');
  }
}

function removeFile(element, inputId, previewId) {
  const input = document.getElementById(inputId);
  const previewDiv = document.getElementById(previewId);

  // Clear the file input
  input.value = '';

  // Remove the file item from preview with animation
  const fileItem = element.parentElement;
  fileItem.style.opacity = '0';
  fileItem.style.transform = 'translateX(20px)';

  setTimeout(() => {
    fileItem.remove();
    // If no more files, hide preview
    if (previewDiv.children.length === 0) {
      previewDiv.classList.remove('has-files');
    }
  }, 300);
} 