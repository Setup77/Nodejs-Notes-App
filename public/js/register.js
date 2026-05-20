document.line = true;
const form = document.getElementById("registerForm");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const password2 = document.getElementById("password2");
const captchaInput = document.getElementById("captchaInput");
const submitBtn = document.getElementById("submitBtn");
const emailFeedback = document.getElementById("emailFeedback");

let isEmailUnique = false;
let isCaptchaCorrect = false;

// Rafraîchir le CAPTCHA
document
  .getElementById("refreshCaptcha")
  .addEventListener("click", function () {
    document.getElementById("captchaImage").src = "/captcha?t=" + Date.now();
    captchaInput.value = "";
    isCaptchaCorrect = false; // Réinitialise l'état
    captchaInput.classList.remove("is-valid", "is-invalid");
    validateForm();
  });

// Vérification asynchrone du CAPTCHA en temps réel (Déclenchée à 6 caractères)
captchaInput.addEventListener("input", async function () {
  const captchaValue = captchaInput.value.trim().toLowerCase();

  // On attend que l'utilisateur ait saisi les 6 caractères avant d'interroger l'API
  if (captchaValue.length !== 6) {
    isCaptchaCorrect = false;
    captchaInput.classList.remove("is-valid");
    validateForm();
    return;
  }

  try {
    const response = await fetch("/api/check-captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captcha: captchaValue }),
    });

    if (!response.ok) {
      isCaptchaCorrect = false;
      validateForm();
      return;
    }

    const data = await response.json();
    isCaptchaCorrect = data.valid;
  } catch (err) {
    console.error("Erreur validation captcha :", err);
    isCaptchaCorrect = false;
  }

  validateForm();
});

// Vérification asynchrone de l'unicité de l'email
email.addEventListener("blur", async function () {
  const emailValue = email.value.trim();

  // Si le champ est vide, on ne lève pas d'erreur immédiate ici
  if (emailValue === "") {
    return;
  }

  // Vérification du format natif HTML5
  if (!email.checkValidity()) {
    email.classList.remove("is-valid");
    email.classList.add("is-invalid");
    emailFeedback.textContent = "Veuillez entrer une adresse email valide.";
    isEmailUnique = false;
    validateForm();
    return;
  }

  try {
    const response = await fetch("/api/check-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: emailValue }),
    });

    if (!response.ok) {
      console.error("Erreur serveur détectée, statut : " + response.status);
      isEmailUnique = false;
      validateForm();
      return;
    }

    const data = await response.json();

    if (data.exists) {
      email.setCustomValidity("Cet email est déjà utilisé.");
      emailFeedback.textContent = "Cet email est déjà lié à un compte.";
      isEmailUnique = false;
    } else {
      email.setCustomValidity("");
      isEmailUnique = true;
    }
  } catch (err) {
    console.error("Erreur réseau ou parsing JSON :", err);
    isEmailUnique = false;
  }
  validateForm();
});

// Nettoie l'état d'erreur pendant que l'utilisateur corrige son email
email.addEventListener("input", function () {
  email.setCustomValidity("");
  if (email.classList.contains("is-invalid") && email.checkValidity()) {
    email.classList.remove("is-invalid");
  }
});

// Évaluation de la force du mot de passe
password.addEventListener("input", function () {
  const val = password.value;
  const bar = document.getElementById("passwordStrengthBar");
  const text = document.getElementById("passwordStrengthText");

  let score = 0;
  if (val.length >= 6) score += 1;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score += 1;
  if (/[^A-Za-z0-9]/.test(val) && val.length >= 10) score += 1;

  if (val.length === 0) {
    bar.style.width = "0%";
    text.textContent = "Force : Non saisi";
  } else if (val.length < 6) {
    bar.style.width = "33%";
    bar.className = "progress-bar bg-danger";
    text.textContent = "Force : Trop court (6 min)";
  } else if (score === 1) {
    bar.style.width = "33%";
    bar.className = "progress-bar bg-danger";
    text.textContent = "Force : Faible";
  } else if (score === 2) {
    bar.style.width = "66%";
    bar.className = "progress-bar bg-warning";
    text.textContent = "Force : Moyenne";
  } else {
    bar.style.width = "100%";
    bar.className = "progress-bar bg-success";
    text.textContent = "Force : Forte";
  }

  validateForm();
});

// Validation globale du formulaire
function validateForm() {
  const isFirstNameValid = firstName.value.trim().length >= 3;
  const isLastNameValid = lastName.value.trim().length >= 3;
  const isPasswordValid = password.value.length >= 6;
  const isConfirmValid =
    password.value === password2.value && password2.value.length > 0;

  // Gestion visuelle des classes Bootstrap
  toggleValidationClass(firstName, isFirstNameValid);
  toggleValidationClass(lastName, isLastNameValid);
  toggleValidationClass(password, isPasswordValid);
  toggleValidationClass(password2, isConfirmValid);
  toggleValidationClass(email, isEmailUnique && email.checkValidity());

  // Classe visuelle pour le CAPTCHA basée sur la réponse de l'API
  toggleValidationClass(captchaInput, isCaptchaCorrect);

  // Activation du bouton uniquement si TOUT est valide (incluant l'API Captcha)
  if (
    isFirstNameValid &&
    isLastNameValid &&
    isEmailUnique &&
    isPasswordValid &&
    isConfirmValid &&
    isCaptchaCorrect
  ) {
    submitBtn.removeAttribute("disabled");
  } else {
    submitBtn.setAttribute("disabled", "true");
  }
}

function toggleValidationClass(element, isValid) {
  if (element.value.trim().length > 0 || element === email) {
    if (isValid) {
      element.classList.remove("is-invalid");
      element.classList.add("is-valid");
    } else {
      element.classList.remove("is-valid");
      element.classList.add("is-invalid");
    }
  } else {
    element.classList.remove("is-valid", "is-invalid");
  }
}

// Événements de contrôle en temps réel
firstName.addEventListener("input", validateForm);
lastName.addEventListener("input", validateForm);
password2.addEventListener("input", validateForm);
captchaInput.addEventListener("input", validateForm);
