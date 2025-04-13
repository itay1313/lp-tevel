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

// Global object to store uploaded files
const uploadedFiles = {
  idPreview: [],
  licensePreview: []
};

// Function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Unified file upload handler
async function handleFileUpload(input, previewId) {
  const previewArea = document.getElementById(previewId);
  const files = input.files;

  if (!files || files.length === 0) return;

  // Initialize array for this upload area if it doesn't exist
  if (!uploadedFiles[previewId]) {
    uploadedFiles[previewId] = [];
  }

  // Clear existing previews
  previewArea.innerHTML = '';

  // Process each file
  for (const file of files) {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage('סוג הקובץ אינו נתמך. אנא העלה קובץ מסוג PDF, JPG או PNG.', 'error');
      input.value = '';
      return;
    }

    // Check file size (4MB limit)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      showMessage('גודל הקובץ חורג מ-4MB המותרים. אנא העלה קובץ קטן יותר.', 'error');
      input.value = '';
      return;
    }

    // Add file to uploaded files array
    uploadedFiles[previewId].push(file);

    // Create preview element
    const previewElement = document.createElement('div');
    previewElement.className = 'file-item';

    // Add file icon
    const icon = document.createElement('div');
    icon.className = 'file-icon';
    if (file.type === 'application/pdf') {
      icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>';
    } else {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = '60px';
      img.style.maxHeight = '60px';
      icon.appendChild(img);
    }
    previewElement.appendChild(icon);

    // Add file name
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    previewElement.appendChild(fileName);

    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = function (e) {
      e.preventDefault();
      const index = uploadedFiles[previewId].indexOf(file);
      if (index > -1) {
        uploadedFiles[previewId].splice(index, 1);
      }
      previewElement.remove();

      if (uploadedFiles[previewId].length === 0) {
        previewArea.classList.remove('has-files');
      }
    };
    previewElement.appendChild(removeBtn);

    previewArea.appendChild(previewElement);
  }

  // Show preview area
  previewArea.classList.add('has-files');

  // Add "Upload another file" button if there's room for more files
  if (uploadedFiles[previewId].length < 2) {
    const uploadAnotherBtn = document.createElement('button');
    uploadAnotherBtn.className = 'upload-another-btn';
    uploadAnotherBtn.innerHTML = 'העלה קובץ נוסף';
    uploadAnotherBtn.onclick = function (e) {
      e.preventDefault();
      input.click();
    };
    previewArea.appendChild(uploadAnotherBtn);
  }
}

// Form submission handling
document.getElementById('tevelForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Get the current active step
  const currentStep = document.querySelector('.form-step.active');
  if (!currentStep) return;

  // Create FormData object
  const formData = new FormData(this);

  try {
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> שולח...';
    submitBtn.disabled = true;

    // Convert and add ID documents to form data
    if (uploadedFiles['idPreview'] && uploadedFiles['idPreview'].length > 0) {
      for (let i = 0; i < uploadedFiles['idPreview'].length; i++) {
        const file = uploadedFiles['idPreview'][i];
        const base64Data = await fileToBase64(file);
        formData.append(`id_document_${i}`, base64Data);
        formData.append(`id_document_${i}_name`, file.name);
        formData.append(`id_document_${i}_type`, file.type);
      }
      formData.append('id_document_count', uploadedFiles['idPreview'].length.toString());
    }

    // Convert and add license documents to form data
    if (uploadedFiles['licensePreview'] && uploadedFiles['licensePreview'].length > 0) {
      for (let i = 0; i < uploadedFiles['licensePreview'].length; i++) {
        const file = uploadedFiles['licensePreview'][i];
        const base64Data = await fileToBase64(file);
        formData.append(`drivers_license_${i}`, base64Data);
        formData.append(`drivers_license_${i}_name`, file.name);
        formData.append(`drivers_license_${i}_type`, file.type);
      }
      formData.append('drivers_license_count', uploadedFiles['licensePreview'].length.toString());
    }

    // Submit form data
    const response = await fetch(this.action, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });

    // Show success message
    showThankYouMessage();

  } catch (error) {
    console.error('Error:', error);
    showMessage('אירעה שגיאה בהעלאת הקבצים. אנא נסה שוב.', 'error');
  } finally {
    // Reset submit button
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Helper function to format birth date
function formatBirthDate(day, month, year) {
  if (!day || !month || !year) return '';

  // Pad day and month with leading zeros if needed
  day = day.padStart(2, '0');
  month = month.padStart(2, '0');

  // Return date in YYYY-MM-DD format
  return `${year}-${month}-${day}`;
}

// Confetti effect
function triggerConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

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

// Bank selection functionality
document.addEventListener('DOMContentLoaded', function () {
  const bankSearch = document.getElementById('bankSearch');
  const bankDropdown = document.getElementById('bankDropdown');
  const selectedBankValue = document.getElementById('selectedBankValue');
  const bankOptions = document.querySelectorAll('.bank-option');

  // Show dropdown when clicking on search input
  bankSearch.addEventListener('click', function (e) {
    e.stopPropagation();
    bankDropdown.classList.add('show');
  });

  // Show dropdown when focusing on search input
  bankSearch.addEventListener('focus', function () {
    bankDropdown.classList.add('show');
  });

  // Handle bank search
  bankSearch.addEventListener('input', function () {
    const searchText = this.value.toLowerCase();
    let hasVisibleOptions = false;

    bankOptions.forEach(option => {
      const bankName = option.getAttribute('data-name').toLowerCase();
      const bankValue = option.getAttribute('data-value');
      const fullText = option.textContent.toLowerCase();

      // Search in bank name, bank code, and full text
      if (bankName.includes(searchText) ||
        bankValue.includes(searchText) ||
        fullText.includes(searchText)) {
        option.classList.remove('hidden');
        hasVisibleOptions = true;
      } else {
        option.classList.add('hidden');
      }
    });

    // Show/hide dropdown based on search results
    if (hasVisibleOptions) {
      bankDropdown.classList.add('show');
    } else {
      bankDropdown.classList.remove('show');
    }
  });

  // Handle bank selection
  bankOptions.forEach(option => {
    option.addEventListener('click', function () {
      const bankName = this.getAttribute('data-name');
      const bankValue = this.getAttribute('data-value');

      // Update input and hidden value
      bankSearch.value = `${bankName} - ${bankValue}`;
      selectedBankValue.value = bankValue;

      // Update visual feedback
      bankOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');

      // Hide dropdown
      bankDropdown.classList.remove('show');

      // Remove any error state
      removeError(bankSearch);
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!bankSearch.contains(e.target) && !bankDropdown.contains(e.target)) {
      bankDropdown.classList.remove('show');

      // If no bank is selected and search is empty, show error
      if (!selectedBankValue.value && !bankSearch.value) {
        showError(bankSearch, 'נא לבחור בנק');
      }
    }
  });

  // Prevent form submission on enter key in search
  bankSearch.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();

      // If only one option is visible, select it
      const visibleOptions = Array.from(bankOptions).filter(opt => !opt.classList.contains('hidden'));
      if (visibleOptions.length === 1) {
        visibleOptions[0].click();
      }
    }
  });
});

// File Upload Handling
function initializeFileUploads() {
  const uploadBoxes = document.querySelectorAll('.upload-box');

  uploadBoxes.forEach(box => {
    const fileInput = box.querySelector('input[type="file"]');
    const skipCheckbox = box.querySelector('.skip-upload');
    const uploadArea = box.querySelector('.upload-area');
    const filePreview = box.querySelector('.file-preview');
    const uploadedFiles = new Set();

    if (skipCheckbox) {
      skipCheckbox.addEventListener('change', (e) => {
        uploadArea.classList.toggle('disabled', e.target.checked);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        // Validate files before handling
        if (validateFileUpload(fileInput, 10)) { // 10MB max size
          handleFileSelection(e);
        }
      });
    }

    function handleFileSelection(e) {
      const files = Array.from(e.target.files);

      files.forEach(file => {
        if (!uploadedFiles.has(file.name)) {
          uploadedFiles.add(file.name);
          addFilePreview(file);
        }
      });

      if (uploadedFiles.size > 0) {
        filePreview.classList.add('has-files');
      }
    }

    function addFilePreview(file) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';

      // Check icon
      const checkIcon = document.createElement('span');
      checkIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      // File name
      const fileName = document.createElement('span');
      fileName.textContent = file.name;

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-file';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = () => {
        fileItem.remove();
        uploadedFiles.delete(file.name);

        if (uploadedFiles.size === 0) {
          filePreview.classList.remove('has-files');
        }
      };

      fileItem.appendChild(checkIcon);
      fileItem.appendChild(fileName);
      fileItem.appendChild(removeBtn);
      filePreview.appendChild(fileItem);
    }
  });
}

// Credit Card Validation
function initializeCreditCardValidation() {
  const creditCardInput = document.getElementById('creditCard');
  const creditCardError = document.getElementById('creditCardError');

  if (!creditCardInput || !creditCardError) return;

  creditCardInput.addEventListener('input', function (e) {
    // Remove any non-digit characters
    let value = e.target.value.replace(/\D/g, '');

    // Format the number with spaces every 4 digits
    value = value.replace(/(\d{4})/g, '$1 ').trim();

    // Update the input value
    e.target.value = value;

    // Simple validation - just check if we have at least 13 digits
    if (value.replace(/\s/g, '').length >= 13) {
      creditCardError.textContent = '';
      creditCardInput.classList.remove('error');
    } else {
      creditCardError.textContent = 'נא להזין מספר כרטיס תקין';
      creditCardInput.classList.add('error');
    }
  });
}

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
  initializeFileUploads();
  initializeCreditCardValidation();
  // ... existing initialization code ...
}); 