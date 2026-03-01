// AChave Content Script — Auto-fill credentials
// This script is injected into web pages and listens for messages from the extension popup

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ACHAVE_AUTOFILL') {
    const { email, password } = message.payload;
    const result = fillCredentials(email, password);
    sendResponse(result);
  }
  return true; // keep message channel open for async response
});

function fillCredentials(email, password) {
  // Find all visible inputs on the page
  const inputs = Array.from(document.querySelectorAll('input'));
  const visibleInputs = inputs.filter(input => {
    const style = window.getComputedStyle(input);
    return style.display !== 'none' && style.visibility !== 'hidden' && input.offsetParent !== null;
  });

  let emailField = null;
  let passwordField = null;
  let filled = { email: false, password: false };

  // Strategy 1: Find by type
  passwordField = visibleInputs.find(i => i.type === 'password');
  
  // Strategy 2: Find email/username field
  emailField = visibleInputs.find(i => 
    i.type === 'email' || 
    i.type === 'text' && (
      /email|user|login|account|nombre|correo|usuario/i.test(i.name) ||
      /email|user|login|account|nombre|correo|usuario/i.test(i.id) ||
      /email|user|login|account|nombre|correo|usuario/i.test(i.placeholder) ||
      /email|user|login|account|nombre|correo|usuario/i.test(i.getAttribute('autocomplete') || '')
    )
  );

  // Strategy 3: If no email field found by attributes, take the text input before the password field
  if (!emailField && passwordField) {
    const pwdIndex = visibleInputs.indexOf(passwordField);
    for (let i = pwdIndex - 1; i >= 0; i--) {
      if (visibleInputs[i].type === 'text' || visibleInputs[i].type === 'email' || visibleInputs[i].type === 'tel') {
        emailField = visibleInputs[i];
        break;
      }
    }
  }

  // Strategy 4: Just find any text/email input
  if (!emailField) {
    emailField = visibleInputs.find(i => i.type === 'email' || i.type === 'text');
  }

  // Fill the fields using native input value setter to trigger React/Vue/Angular change detection
  if (emailField && email) {
    setNativeValue(emailField, email);
    filled.email = true;
  }

  if (passwordField && password) {
    setNativeValue(passwordField, password);
    filled.password = true;
  }

  return {
    success: filled.email || filled.password,
    filled,
    message: getResultMessage(filled),
  };
}

function setNativeValue(element, value) {
  // This approach works with React, Vue, Angular and vanilla JS
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  
  nativeInputValueSetter.call(element, value);
  
  // Dispatch events to trigger framework change detection
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
  
  // Also try focus for good measure
  element.focus();
}

function getResultMessage(filled) {
  if (filled.email && filled.password) return '✅ Email y contraseña completados';
  if (filled.email) return '⚠️ Solo se completó el email';
  if (filled.password) return '⚠️ Solo se completó la contraseña';
  return '❌ No se encontraron campos de login';
}
