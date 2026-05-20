// Enveloppe isolante IIFE pour éviter les collisions de variables globales
//let selectedFilesArray = [];
// On initialise la variable sur l'objet global window uniquement si elle n'existe pas encore
if (!window.selectedFilesArray) {
  window.selectedFilesArray = [];
}
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addNoteForm");
    const fileInput = document.getElementById("attachments");
    const submitButton = form
      ? form.querySelector('button[type="submit"]')
      : null;

    // --- 1. FONCTION DE VÉRIFICATION GLOBALE DU FORMULAIRE ---
    function checkFormValidity() {
      if (!form || !submitButton) return;

      // Vérifie la validité des champs requis visibles (Titre, corps ou checklist)
      const isHtmlValid = form.checkValidity();

      // Le bouton s'active si le texte requis est valide ET qu'on a moins de 5 fichiers
      if (isHtmlValid && selectedFilesArray.length <= 5) {
        submitButton.removeAttribute("disabled");
      } else {
        submitButton.setAttribute("disabled", "true");
      }
    }

    // --- 2. INITIALISATION ET ACTIONS DE VALIDATION ---
    if (form) {
      checkFormValidity();

      // Sécurité : On cible uniquement les éléments de saisie textuelle pour la validation en temps réel
      form.addEventListener("input", (e) => {
        const input = e.target;

        // On ignore le champ fichier et la zone d'aperçu pour éviter les conflits
        if (input.type === "file" || input.closest("#mediaPreviewContainer"))
          return;

        if (input.hasAttribute("required")) {
          if (input.checkValidity()) {
            input.classList.remove("is-invalid");
            input.classList.add("is-valid");
          } else {
            input.classList.remove("is-valid");
            input.classList.add("is-invalid");
          }
        }

        // Recalculer la validité globale
        checkFormValidity();
      });

      // Gestion de la soumission du formulaire
      form.addEventListener(
        "submit",
        (e) => {
          syncFilesToInput();

          if (!form.checkValidity() || selectedFilesArray.length > 5) {
            e.preventDefault();
            e.stopPropagation();
          }
          form.classList.add("was-validated");
        },
        false,
      );
    }

    // --- 3. ÉCOUTEUR DU CHAMP DE FICHIERS MULTIPLES ---
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        if (e.target.files) {
          const incomingFiles = Array.from(e.target.files);

          for (const file of incomingFiles) {
            // Éviter l'ajout de doublons exacts
            const isDuplicate = selectedFilesArray.some(
              (f) => f.name === file.name && f.size === file.size,
            );

            if (!isDuplicate) {
              if (selectedFilesArray.length >= 5) {
                Swal.fire({
                  title: "Erreur !",
                  text: "Limite atteinte : Vous ne pouvez pas sélectionner plus de 5 médias au total.",
                  icon: "warning",
                  timer: 5000,
                  confirmButtonText: "OK",
                  customClass: {
                    confirmButton: "btn btn-primary rounded-pill px-4",
                  },
                  buttonsStyling: false,
                });
                break;
              }
              selectedFilesArray.push(file);
            }
          }
        }

        // Réinitialisation pour permettre de re-sélectionner le même fichier si supprimé
        fileInput.value = "";

        // Relancer l'affichage graphique de la zone de prévisualisation
        renderMediaPreviews();
        checkFormValidity();
      });
    }

    // --- 4. RENDER DE LA ZONE DE PRÉVISUALISATION ET DE SUPPRESSION ---
    function renderMediaPreviews() {
      const previewZone = document.getElementById("mediaPreview");
      const container = document.getElementById("mediaPreviewContainer");

      if (!previewZone) return;
      previewZone.innerHTML = "";

      if (selectedFilesArray.length > 0) {
        if (container) container.classList.remove("d-none");

        selectedFilesArray.forEach((file, index) => {
          const fileType = file.type;
          const fileName = file.name;
          const fileExtension = fileName.split(".").pop().toLowerCase();

          const col = document.createElement("div");
          col.className =
            "d-flex flex-column align-items-center text-center p-2 border rounded bg-light position-relative";
          col.style.width = "130px";

          // Bouton de suppression individuelle (Croix rouge)
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className =
            "btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center position-absolute";
          deleteBtn.style =
            "top: -5px; right: -5px; width: 24px; height: 24px; padding: 0; z-index: 10; border: 2px solid white;";
          deleteBtn.innerHTML =
            '<i class="fa fa-times" style="font-size: 0.7rem;"></i>';

          // L'événement click appelle la fonction de suppression
          deleteBtn.addEventListener("click", (evt) => {
            evt.preventDefault();
            removeSelectedFile(index);
          });
          col.appendChild(deleteBtn);

          let mediaElement = "";

          // Aperçu Image
          if (fileType.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
              const img = col.querySelector(".preview-img");
              if (img) img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            mediaElement = `<img src="" class="preview-img rounded mb-1 border" style="width: 110px; height: 110px; object-fit: cover;">`;
          }
          // Aperçu Vidéo
          else if (fileType.startsWith("video/")) {
            const fileURL = URL.createObjectURL(file);
            mediaElement = `<video src="${fileURL}" class="rounded mb-1 border" style="width: 110px; height: 110px; object-fit: cover;" controls></video>`;
          }
          // Aperçu Documents (PDF, Word, Excel)
          else {
            let iconSrc = "/img/media_word.png";
            if (fileType === "application/pdf" || fileExtension === "pdf") {
              iconSrc = "/img/media_pdf.png";
            } else if (
              ["xls", "xlsx", "csv"].includes(fileExtension) ||
              fileType.includes("excel") ||
              fileType.includes("spreadsheetml")
            ) {
              iconSrc = "/img/media_xls.png";
            } else if (
              ["doc", "docx"].includes(fileExtension) ||
              fileType.includes("word") ||
              fileType.includes("officedocument.wordprocessingml")
            ) {
              iconSrc = "/img/media_word.png";
            }
            mediaElement = `<img src="${iconSrc}" class="rounded mb-1" style="width: 80px; height: 80px; object-fit: contain;">`;
          }

          const shortName =
            fileName.length > 12 ? fileName.substring(0, 9) + "..." : fileName;
          const textContainer = document.createElement("div");
          textContainer.className = "w-100";
          textContainer.innerHTML = `${mediaElement}<small class="text-dark fw-medium text-wrap text-break mt-1 d-block" style="font-size: 0.72rem; line-height: 1.1;" title="${fileName}">${shortName}</small>`;

          col.appendChild(textContainer);
          previewZone.appendChild(col);
        });
      } else {
        if (container) container.classList.add("d-none");
      }

      // Synchronisation finale de la validité du bouton
      if (form && submitButton) {
        if (form.checkValidity() && selectedFilesArray.length <= 5) {
          submitButton.removeAttribute("disabled");
        } else {
          submitButton.setAttribute("disabled", "true");
        }
      }
    }

    // --- 5. RETRAIT D'UN FICHIER DU TABLEAU DE STOCKAGE ---
    function removeSelectedFile(index) {
      selectedFilesArray.splice(index, 1);
      renderMediaPreviews();
      checkFormValidity();
    }

    // --- 6. SYNCHRONISATION DU FLUX AVANT LE POST ---
    function syncFilesToInput() {
      if (!fileInput) return;
      const dataTransfer = new DataTransfer();
      selectedFilesArray.forEach((file) => {
        dataTransfer.items.add(file);
      });
      fileInput.files = dataTransfer.files;
    }
  });

  // --- 7. EXPOSITION GLOBALE DU THÈME DE COULEURS ---
  window.selectCardTheme = function (
    buttonElement,
    categoryClassName,
    backgroundValue,
    textColor,
  ) {
    const textarea = document.getElementById("body");
    const categoryInput = document.getElementById("colorCategory");

    if (categoryInput) categoryInput.value = categoryClassName;

    if (textarea) {
      textarea.style.background = backgroundValue;
      textarea.style.color = textColor;

      if (textColor === "#ffffff") {
        textarea.classList.add("placeholder-white");
        textarea.style.setProperty("--bs-body-color", "#ffffff");
      } else {
        textarea.classList.remove("placeholder-white");
        textarea.style.setProperty("--bs-body-color", "#212529");
      }
    }

    const buttons = buttonElement.parentElement.querySelectorAll("button");
    buttons.forEach((btn) =>
      btn.classList.remove("border", "border-2", "border-dark"),
    );
    buttonElement.classList.add("border", "border-2", "border-dark");
  };
})();
