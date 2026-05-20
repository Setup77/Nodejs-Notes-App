function toggleNoteType(value) {
  const textContainer = document.getElementById("textBodyContainer");
  const todoContainer = document.getElementById("todoChecklistContainer");
  const textareaBody = document.getElementById("body");
  const firstChecklistItem = document.querySelector(
    'input[name="checklistItems"]',
  );

  if (value === "true") {
    // --- FORMAT TO-DO LIST SÉLECTIONNÉ ---
    if (textContainer) textContainer.classList.add("d-none");
    if (todoContainer) todoContainer.classList.remove("d-none");

    // ❌ Le textarea n'est plus obligatoire
    if (textareaBody) {
      textareaBody.removeAttribute("required");
      textareaBody.classList.remove("is-invalid", "is-valid"); // Nettoie les classes Bootstrap
    }

    //  Le premier champ de la checklist devient obligatoire
    if (firstChecklistItem) {
      firstChecklistItem.setAttribute("required", "true");
    }
  } else {
    // --- FORMAT TEXTE CLASSIQUE SÉLECTIONNÉ ---
    if (textContainer) textContainer.classList.remove("d-none");
    if (todoContainer) todoContainer.classList.add("d-none");

    //  Le textarea redevient obligatoire
    if (textareaBody) {
      textareaBody.setAttribute("required", "true");
    }

    // ❌ La checklist n'est plus obligatoire
    if (firstChecklistItem) {
      firstChecklistItem.removeAttribute("required");
      firstChecklistItem.classList.remove("is-invalid", "is-valid");
    }
  }

  //  Très important : Déclencher manuellement une vérification de la validité du formulaire
  // pour débloquer ou bloquer le bouton d'enregistrement immédiatement après le clic.
  const form = document.getElementById("addNoteForm");
  if (form) {
    // Émet un événement input fictif sur le titre pour forcer le script global à recalculer
    const titleInput = document.getElementById("title");
    if (titleInput) {
      titleInput.dispatchEvent(new Event("input"));
    }
  }
}

function addChecklistItem() {
  const wrapper = document.getElementById("checklistFields");
  if (!wrapper) return;

  const div = document.createElement("div");
  div.className = "input-group shadow-sm animate-fade-in";
  div.innerHTML = `
      <span class="input-group-text bg-white border-0"><i class="fa fa-square text-muted"></i></span>
      <input type="text" name="checklistItems" class="form-control border-0" placeholder="Nouvelle tâche...">
      <button type="button" class="btn btn-white text-danger border-0 remove-todo-btn"><i class="fa fa-trash"></i></button>
    `;

  // Écouteur pour la suppression de cette ligne spécifique
  const deleteBtn = div.querySelector(".remove-todo-btn");
  deleteBtn.addEventListener("click", () => {
    div.remove();
    // 🔄 Force le formulaire à recalculer sa validité après la suppression d'un champ
    triggerFormValidationRefresh();
  });

  wrapper.appendChild(div);

  // 🔄 Force le formulaire à recalculer sa validité après l'ajout d'un nouveau champ vide
  triggerFormValidationRefresh();
}

// Fonction utilitaire pour rafraîchir l'état du bouton d'envoi
function triggerFormValidationRefresh() {
  const titleInput = document.getElementById("title");
  if (titleInput) {
    titleInput.dispatchEvent(new Event("input"));
  }
}

//⚡ Script JavaScript d'interception et de pré-remplissage ⚡
document.addEventListener("DOMContentLoaded", function () {
  //===RECHERCHES

  const searchInput = document.getElementById("search");
  const noResultsMessage = document.getElementById("noResultsMessage");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const filterValue = e.target.value.toLowerCase().trim();
      const noteCards = document.querySelectorAll(".note-card-container");
      let visibleCardsCount = 0;

      noteCards.forEach((card) => {
        // Récupération des textes cibles à l'intérieur de la carte
        const titleElement = card.querySelector(".note-title");
        const bodyElement = card.querySelector(".note-body");
        const tagElements = card.querySelectorAll(".note-tag");

        const titleText = titleElement
          ? titleElement.textContent.toLowerCase()
          : "";
        const bodyText = bodyElement
          ? bodyElement.textContent.toLowerCase()
          : "";

        // Concaténation de tous les tags de la note
        let tagsText = "";
        tagElements.forEach((tag) => {
          tagsText += tag.textContent.toLowerCase() + " ";
        });

        // Vérification de la correspondance
        if (
          titleText.includes(filterValue) ||
          bodyText.includes(filterValue) ||
          tagsText.includes(filterValue)
        ) {
          card.style.setProperty("display", "", "important"); // Réinitialise l'affichage
          visibleCardsCount++; // Incrémente le compteur de cartes visibles
        } else {
          card.style.setProperty("display", "none", "important"); // Masque la carte
        }
      });

      // --- GESTION DU MESSAGE DYNAMIQUE ---
      if (noResultsMessage) {
        if (visibleCardsCount === 0 && noteCards.length > 0) {
          noResultsMessage.classList.remove("d-none"); // Affiche le message
        } else {
          noResultsMessage.classList.add("d-none"); // Masque le message
        }
      }
    });
  }
});

// === DELETE
function confirmDelete(noteId) {
  Swal.fire({
    title: "Êtes-vous sûr ?",
    text: "Cette action est irréversible. La note et toutes ses pièces jointes seront définitivement supprimées.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Oui, supprimer !",
    cancelButtonText: "Annuler",
    customClass: {
      confirmButton: "btn btn-danger rounded-pill px-4 me-2",
      cancelButton: "btn btn-light rounded-pill px-4",
    },
    buttonsStyling: false,
  }).then((result) => {
    if (result.isConfirmed) {
      // Extraction dynamique du token CSRF présent dans la page pour sécuriser l'appel AJAX
      const csrfTokenInput = document.querySelector('input[name="_csrf"]');
      const csrfToken = csrfTokenInput ? csrfTokenInput.value : "";

      // Envoi de la requête DELETE en arrière-plan
      fetch(`/dashboard/item-delete-${noteId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-TOKEN": csrfToken,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.redirected) {
            // Si le serveur répond par une redirection (comportement d'Express), on la suit
            window.location.href = response.url;
          } else if (response.ok) {
            // Si succès sans redirection automatique, on affiche une alerte et on recharge
            Swal.fire({
              title: "Supprimé !",
              text: "La note a bien été supprimée.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              window.location.reload();
            });
          } else {
            throw new Error("Erreur lors de la suppression");
          }
        })
        .catch((error) => {
          console.error(error);
          Swal.fire({
            title: "Erreur !",
            text: "Impossible de supprimer la note pour le moment.",
            icon: "error",
            confirmButtonText: "OK",
          });
        });
    }
  });
}
