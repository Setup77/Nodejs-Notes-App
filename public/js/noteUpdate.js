if (!window.editSelectedFilesArray) {
  window.editSelectedFilesArray = [];
}

function toggleEditNoteType(value) {
  const textContainer = document.getElementById("editTextBodyContainer");
  const todoContainer = document.getElementById("editTodoChecklistContainer");
  const textareaBody = document.getElementById("editBody");
  if (value === "true") {
    textContainer?.classList.add("d-none");
    todoContainer?.classList.remove("d-none");
    textareaBody?.removeAttribute("required");
  } else {
    textContainer?.classList.remove("d-none");
    todoContainer?.classList.add("d-none");
    textareaBody?.setAttribute("required", "true");
  }
}

function addEditChecklistItem(textValue = "", isChecked = false) {
  const wrapper = document.getElementById("editChecklistFields");
  if (!wrapper) return;
  const div = document.createElement("div");
  div.className = "input-group shadow-sm";
  div.innerHTML = `
    <span class="input-group-text bg-white border-0">
      <i class="fa ${isChecked ? "fa-check-square text-success" : "fa-square text-muted"}"></i>
    </span>
    <input type="text" name="checklistItems" class="form-control border-0" value="${textValue}" placeholder="Modifier la tâche...">
    <input type="hidden" name="checklistStatus" value="${isChecked}">
    <button type="button" class="btn btn-white text-danger border-0" onclick="this.parentElement.remove()"><i class="fa fa-trash-alt"></i></button>
  `;
  wrapper.appendChild(div);
}

function selectEditCardTheme(
  buttonElement,
  categoryName,
  backgroundStyle,
  textColor,
) {
  document.getElementById("editColorCategory").value = categoryName;
  const textarea = document.getElementById("editBody");
  if (textarea) {
    textarea.style.background = backgroundStyle;
    textarea.style.color = textColor;
  }
  buttonElement.parentElement
    .querySelectorAll("button")
    .forEach((btn) =>
      btn.classList.remove("border", "border-2", "border-dark"),
    );
  buttonElement.classList.add("border", "border-2", "border-dark");
}

if (!window.editSelectedFilesArray) {
  window.editSelectedFilesArray = [];
}

document.addEventListener("DOMContentLoaded", function () {
  const editModal = document.getElementById("editNoteModal");
  if (!editModal) return;

  const fileInput = document.getElementById("editAttachments");
  const editFilesArray = window.editSelectedFilesArray;

  // --- 1. INTERCEPTION ET OUVERTURE DE LA MODALE ---
  editModal.addEventListener("show.bs.modal", function (event) {
    const button = event.relatedTarget;

    const noteId = button.getAttribute("data-id");
    document.getElementById("editNoteForm").action =
      `/dashboard/item-${noteId}`;
    document.getElementById("editTitle").value =
      button.getAttribute("data-title") || "";
    document.getElementById("editBody").value =
      button.getAttribute("data-body") || "";
    document.getElementById("editTags").value =
      button.getAttribute("data-tags") || "";

    const isTodo = button.getAttribute("data-istodo") === "true";
    document.getElementById("editIsTodo").value = isTodo.toString();
    toggleEditNoteType(isTodo.toString());

    document.getElementById("editIsPinned").checked =
      button.getAttribute("data-ispinned") === "true";
    document.getElementById("editIsPrivate").checked =
      button.getAttribute("data-isprivate") === "true";

    const category = button.getAttribute("data-colorcategory") || "default";
    document.getElementById("editColorCategory").value = category;
    const targetBtn = Array.from(
      editModal.querySelectorAll(".edit-color-btn"),
    ).find((b) => b.getAttribute("onclick").includes(`'${category}'`));
    if (targetBtn) targetBtn.click();

    // Remplissage de la Checklist
    const checklistFields = document.getElementById("editChecklistFields");
    checklistFields.innerHTML = "";
    try {
      const checklistData = JSON.parse(
        button.getAttribute("data-checklist") || "[]",
      );
      if (checklistData.length > 0) {
        checklistData.forEach((item) =>
          addEditChecklistItem(item.text, item.isDone),
        );
      } else if (isTodo) {
        addEditChecklistItem("", false);
      }
    } catch (e) {
      console.error(e);
    }

    // Remplissage des Médias Existants (Vignettes style grille comme l'ajout)
    const existingZone = document.getElementById("editExistingAttachmentsZone");
    existingZone.innerHTML = "";
    try {
      const attachments = JSON.parse(
        button.getAttribute("data-attachments") || "[]",
      );
      attachments.forEach((file) => {
        const fileExtension = file.filename.split(".").pop().toLowerCase();

        const col = document.createElement("div");
        col.className =
          "d-flex flex-column align-items-center text-center p-2 border rounded bg-white position-relative";
        col.style.width = "130px";

        // 1. Détection et préparation du visuel du média
        let mediaElement = "";
        if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileExtension)) {
          mediaElement = `<img src="${file.filepath}" class="rounded mb-1 border" style="width: 110px; height: 110px; object-fit: cover;">`;
        } else if (["mp4", "webm", "ogg"].includes(fileExtension)) {
          mediaElement = `<video src="${file.filepath}" class="rounded mb-1 border" style="width: 110px; height: 110px; object-fit: cover;" controls></video>`;
        } else {
          let iconSrc = "/img/media_word.png";
          if (fileExtension === "pdf") {
            iconSrc = "/img/media_pdf.png";
          } else if (["xls", "xlsx", "csv"].includes(fileExtension)) {
            iconSrc = "/img/media_xls.png";
          }
          mediaElement = `<img src="${iconSrc}" class="rounded mb-1" style="width: 80px; height: 80px; object-fit: contain;">`;
        }

        const shortName =
          file.filename.length > 12
            ? file.filename.substring(0, 9) + "..."
            : file.filename;

        // 2. Injection du contenu HTML global AVANT d'attacher le bouton et son écouteur
        col.innerHTML = `
          <div class="w-100">
            ${mediaElement}
            <small class="text-dark fw-medium text-wrap text-break mt-1 d-block" style="font-size: 0.72rem; line-height: 1.1;" title="${file.filename}">${shortName}</small>
          </div>
          <input type="hidden" name="keepAttachments" value="${file._id}">
        `;

        // 3. Création du Bouton de suppression individuelle (Croix rouge)
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className =
          "btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center position-absolute";
        deleteBtn.style.cssText =
          "top: -5px; right: -5px; width: 24px; height: 24px; padding: 0; z-index: 10; border: 2px solid white;";
        deleteBtn.innerHTML =
          '<i class="fa fa-times" style="font-size: 0.7rem;"></i>';

        // 4. Attachement de l'événement Click (Fonctionne à 100% maintenant)
        deleteBtn.addEventListener("click", (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          col.remove(); // Supprime l'élément du DOM visuellement
        });

        // 5. Ajout du bouton en tant que dernier enfant dans le conteneur
        col.appendChild(deleteBtn);

        // 6. Ajout de la vignette dans la zone globale
        existingZone.appendChild(col);
      });
    } catch (e) {
      console.error("Erreur parsing attachments d'édition:", e);
    }

    // Reset de la sélection des nouveaux fichiers à l'ouverture
    editFilesArray.length = 0;
    if (fileInput) fileInput.value = "";
    renderEditMediaPreviews();
  });

  // --- 2. ÉCOUTEUR DU CHAMP DE NOUVEAUX FICHIERS MULTIPLES ---
  fileInput?.addEventListener("change", (e) => {
    if (e.target.files) {
      const incomingFiles = Array.from(e.target.files);

      for (const file of incomingFiles) {
        const isDuplicate = editFilesArray.some(
          (f) => f.name === file.name && f.size === file.size,
        );

        if (!isDuplicate) {
          // Calculer le total cumulé : médias existants conservés restants dans le DOM + nouveaux fichiers en cache JS
          const existingCount = document.querySelectorAll(
            "#editExistingAttachmentsZone input[name='keepAttachments']",
          ).length;
          const totalCount = existingCount + editFilesArray.length;

          if (totalCount >= 5) {
            Swal.fire({
              title: "Erreur !",
              text: "Limite atteinte : Le total combiné des anciens et nouveaux médias ne peut pas dépasser 5 fichiers.",
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
          editFilesArray.push(file);
        }
      }
    }
    fileInput.value = "";
    renderEditMediaPreviews();
  });

  // --- 3. RENDER DE LA ZONE DES NOUVEAUX MÉDIAS SÉLECTIONNÉS ---
  function renderEditMediaPreviews() {
    const previewZone = document.getElementById("editMediaPreview");
    const container = document.getElementById("editMediaPreviewContainer");

    if (!previewZone) return;
    previewZone.innerHTML = "";

    if (editFilesArray.length > 0) {
      container?.classList.remove("d-none");

      editFilesArray.forEach((file, index) => {
        const fileType = file.type;
        const fileName = file.name;
        const fileExtension = fileName.split(".").pop().toLowerCase();

        const col = document.createElement("div");
        col.className =
          "d-flex flex-column align-items-center text-center p-2 border rounded bg-light position-relative";
        col.style.width = "130px";

        // Bouton suppression
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className =
          "btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center position-absolute";
        deleteBtn.style =
          "top: -5px; right: -5px; width: 24px; height: 24px; padding: 0; z-index: 10; border: 2px solid white;";
        deleteBtn.innerHTML =
          '<i class="fa fa-times" style="font-size: 0.7rem;"></i>';

        deleteBtn.addEventListener("click", (evt) => {
          evt.preventDefault();
          editFilesArray.splice(index, 1);
          renderEditMediaPreviews();
        });
        col.appendChild(deleteBtn);

        let mediaElement = "";

        if (fileType.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = col.querySelector(".preview-img");
            if (img) img.src = e.target.result;
          };
          reader.readAsDataURL(file);
          mediaElement = `<img src="" class="preview-img rounded mb-1 border" style="width: 110px; height: 110px; object-fit: cover;">`;
        } else if (fileType.startsWith("video/")) {
          const fileURL = URL.createObjectURL(file);
          mediaElement = `<video src="${fileURL}" class="rounded mb-1 border" style="width: 110px; height: 110px; object-fit: cover;" controls></video>`;
        } else {
          let iconSrc = "/img/media_word.png";
          if (fileType === "application/pdf" || fileExtension === "pdf") {
            iconSrc = "/img/media_pdf.png";
          } else if (
            ["xls", "xlsx", "csv"].includes(fileExtension) ||
            fileType.includes("excel")
          ) {
            iconSrc = "/img/media_xls.png";
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
      container?.classList.add("d-none");
    }
  }

  // --- 4. FORMULAIRE D'INTERCEPTION DE SOUMISSION ---
  document
    .getElementById("editNoteForm")
    ?.addEventListener("submit", function (e) {
      const dataTransfer = new DataTransfer();
      editFilesArray.forEach((file) => dataTransfer.items.add(file));
      if (fileInput) fileInput.files = dataTransfer.files;

      if (!this.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.classList.add("was-validated");
    });
});
