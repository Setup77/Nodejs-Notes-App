/**
 * Fonction globale de génération des blocs graphiques de pagination
 * @param {number} totalPages - Nombre total de pages calculé par le serveur
 * @param {number} currentPage - Page active courante lue depuis l'URL
 */
function renderPagination(totalPages, currentPage) {
  const topEl = document.getElementById("paginationTop");
  const bottomEl = document.getElementById("paginationBottom");

  if (topEl) topEl.innerHTML = "";
  if (bottomEl) bottomEl.innerHTML = "";

  if (totalPages <= 1) return;

  const containers = [topEl, bottomEl].filter((el) => el !== null);

  containers.forEach((paginationEl) => {
    // 1. BOUTON PRÉCÉDENT
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<button class="page-link shadow-sm" type="button" aria-label="Précédent">&laquo;</button>`;
    if (currentPage > 1) {
      prevLi.onclick = () => {
        navigateToPage(currentPage - 1, paginationEl);
      };
    }
    paginationEl.appendChild(prevLi);

    // 2. LOGIQUE DES BLOCS GLISSANTS (...)
    const maxVisibleButtons = 2;
    let startPage = Math.max(2, currentPage - maxVisibleButtons);
    let endPage = Math.min(totalPages - 1, currentPage + maxVisibleButtons);

    // Première Page systématique
    appendPageButton(paginationEl, 1, currentPage);

    // Ellipse gauche
    if (startPage > 2) {
      appendEllipsis(paginationEl);
    }

    // Pages intermédiaires
    for (let p = startPage; p <= endPage; p++) {
      appendPageButton(paginationEl, p, currentPage);
    }

    // Ellipse droite
    if (endPage < totalPages - 1) {
      appendEllipsis(paginationEl);
    }

    // Dernière Page systématique
    if (totalPages > 1) {
      appendPageButton(paginationEl, totalPages, currentPage);
    }

    // 3. BOUTON SUIVANT
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<button class="page-link shadow-sm" type="button" aria-label="Suivant">&raquo;</button>`;
    if (currentPage < totalPages) {
      nextLi.onclick = () => {
        navigateToPage(currentPage + 1, paginationEl);
      };
    }
    paginationEl.appendChild(nextLi);
  });
}

function appendPageButton(container, pageNumber, currentPage) {
  const li = document.createElement("li");
  li.className = `page-item ${pageNumber === currentPage ? "active" : ""}`;
  li.innerHTML = `<button class="page-link shadow-sm" type="button">${pageNumber}</button>`;

  if (pageNumber !== currentPage) {
    li.onclick = () => {
      navigateToPage(pageNumber, container);
    };
  }
  container.appendChild(li);
}

function appendEllipsis(container) {
  const li = document.createElement("li");
  li.className = "page-item disabled";
  li.innerHTML = `<span class="page-link border-0 bg-transparent">...</span>`;
  container.appendChild(li);
}

/**
 * Redirige l'utilisateur vers la page sélectionnée avec gestion du scroll
 */
function navigateToPage(pageNumber, clickedContainer) {
  // Conserve les autres paramètres d'URL (comme les requêtes de recherche) si présents
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("page", pageNumber);

  // Si on clique en bas, on applique une transition de remontée fluide pré-chargement
  if (clickedContainer.id === "paginationBottom") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      window.location.search = urlParams.toString();
    }, 300);
  } else {
    window.location.search = urlParams.toString();
  }
}
