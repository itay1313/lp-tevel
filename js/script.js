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

// Load environment variables
const config = {
  uploadThing: {
    apiKey: process.env.UPLOADTHING_API_KEY || '',
    appId: process.env.UPLOADTHING_APP_ID || ''
  }
};

// Form submission handling
document.getElementById('tevelForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Get the current active step
  const currentStep = document.querySelector('.form-step.active');
  if (!currentStep) return;

  // Create FormData object
  const formData = new FormData(this);

  // Prepare the data object
  const data = {
    Lead_Source: "Online Form",
    Last_Name: formData.get('full_name') || '',
    Email: formData.get('email') || '',
    Phone: formData.get('phone') || '',
    Company: formData.get('workplace') || '',
    Monthly_Income: formData.get('monthly_income') || '',
    Bank_Code: formData.get('bank_code') || '',
    Bank_Branch: formData.get('branch_number') || '',
    Bank_Account: formData.get('account_number') || '',
    Credit_Card: formData.get('credit_card')?.replace(/\s/g, '') || '',
    Birth_Date: formatBirthDate(
      formData.get('birth_day'),
      formData.get('birth_month'),
      formData.get('birth_year')
    ),
    Mother_Name: formData.get('SingleLine') || '',
    Grandmother_Name: formData.get('SingleLine2') || '',
    Consent_Approved: formData.get('creditConsent') === 'on' ? 'Yes' : 'No',
    Terms_Accepted: formData.get('DecisionBox') === 'on' ? 'Yes' : 'No'
  };

  // Add files if they exist and are not skipped
  if (!document.getElementById('skipId')?.checked) {
    const idFiles = formData.getAll('id_document');
    if (idFiles && idFiles.length > 0) {
      for (let i = 0; i < idFiles.length; i++) {
        const file = idFiles[i];
        if (file instanceof File && file.size > 0) {
          data.ID_Document = file;
        }
      }
    }
  }

  if (!document.getElementById('skipLicense')?.checked) {
    const licenseFiles = formData.getAll('drivers_license');
    if (licenseFiles && licenseFiles.length > 0) {
      for (let i = 0; i < licenseFiles.length; i++) {
        const file = licenseFiles[i];
        if (file instanceof File && file.size > 0) {
          data.Drivers_License = file;
        }
      }
    }
  }

  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> שולח...';
  submitBtn.disabled = true;

  try {
    // Create a new FormData object for the actual submission
    const submitFormData = new FormData();

    // Add all non-file data to the FormData
    Object.entries(data).forEach(([key, value]) => {
      if (!(value instanceof File)) {
        submitFormData.append(key, value);
      }
    });

    // Upload files to UploadThing first
    const uploadedUrls = {
      idDocuments: [],
      licenseDocuments: []
    };

    // Handle ID Document files
    const idFiles = formData.getAll('id_document');
    if (idFiles && idFiles.length > 0) {
      for (let i = 0; i < idFiles.length; i++) {
        const file = idFiles[i];
        if (file instanceof File && file.size > 0) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('fileKey', `id_document_${i}`);

            const response = await fetch('https://uploadthing.com/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.uploadThing.apiKey}`,
                'X-Uploadthing-App-Id': config.uploadThing.appId
              },
              body: uploadFormData
            });

            const uploadData = await response.json();
            if (uploadData.url) {
              uploadedUrls.idDocuments.push(uploadData.url);
              submitFormData.append(`ID_Document_URL_${i}`, uploadData.url);
            }
          } catch (error) {
            console.error('Error uploading ID document:', error);
            showMessage('שגיאה בהעלאת תעודת זהות. אנא נסה שוב.', 'error');
          }
        }
      }
      submitFormData.append('ID_Document_URLs', JSON.stringify(uploadedUrls.idDocuments));
      submitFormData.append('ID_Document_count', uploadedUrls.idDocuments.length.toString());
    }

    // Handle Driver's License files
    const licenseFiles = formData.getAll('drivers_license');
    if (licenseFiles && licenseFiles.length > 0) {
      for (let i = 0; i < licenseFiles.length; i++) {
        const file = licenseFiles[i];
        if (file instanceof File && file.size > 0) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('fileKey', `drivers_license_${i}`);

            const response = await fetch('https://uploadthing.com/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.uploadThing.apiKey}`,
                'X-Uploadthing-App-Id': config.uploadThing.appId
              },
              body: uploadFormData
            });

            const uploadData = await response.json();
            if (uploadData.url) {
              uploadedUrls.licenseDocuments.push(uploadData.url);
              submitFormData.append(`Drivers_License_URL_${i}`, uploadData.url);
            }
          } catch (error) {
            console.error('Error uploading license document:', error);
            showMessage('שגיאה בהעלאת רישיון נהיגה. אנא נסה שוב.', 'error');
          }
        }
      }
      submitFormData.append('Drivers_License_URLs', JSON.stringify(uploadedUrls.licenseDocuments));
      submitFormData.append('Drivers_License_count', uploadedUrls.licenseDocuments.length.toString());
    }

    // Only proceed with form submission if all files were uploaded successfully
    if ((idFiles.length > 0 && uploadedUrls.idDocuments.length === 0) ||
      (licenseFiles.length > 0 && uploadedUrls.licenseDocuments.length === 0)) {
      showMessage('שגיאה בהעלאת הקבצים. אנא נסה שוב.', 'error');
      return;
    }

    // Add the required Zoho parameters
    submitFormData.append('xnQsjsdp', formData.get('xnQsjsdp'));
    submitFormData.append('zc_gad', formData.get('zc_gad'));
    submitFormData.append('xmIwtLD', formData.get('xmIwtLD'));
    submitFormData.append('actionType', formData.get('actionType'));
    submitFormData.append('returnURL', formData.get('returnURL'));

    // Send form data with file URLs to Make.com
    const response = await fetch(this.action, {
      method: 'POST',
      body: submitFormData
    });

    if (response.ok) {
      // Hide all form steps
      document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
      });

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.innerHTML = `
        <div class="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#4CAF50"/>
          </svg>
        </div>
        <h2>תודה רבה!</h2>
        <p>הטופס נשלח בהצלחה</p>
        <p class="success-details">נציג יצור איתך קשר בהקדם להמשך התהליך</p>
      `;

      // Insert success message before the form
      const formContainer = document.querySelector('.form-container');
      formContainer.insertBefore(successMessage, this);

      // Trigger confetti
      triggerConfetti();

      // Reset form after 5 seconds
      setTimeout(() => {
        this.reset();
        successMessage.remove();
        document.querySelectorAll('.form-step').forEach(step => {
          step.style.display = 'block';
        });
        document.getElementById('step1').classList.add('active');
        document.getElementById('step3').classList.remove('active');
        updateProgressBar(1);
      }, 5000);

    } else {
      throw new Error('שגיאה בשליחת הטופס');
    }
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
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

function handleFileUpload(input, previewId) {
  const previewDiv = document.getElementById(previewId);

  if (input.files && input.files.length > 0) {
    previewDiv.classList.add('has-files');

    // Get existing files count
    const existingFiles = previewDiv.children.length;

    // Add new files
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

// Helper function to convert file to base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
} 