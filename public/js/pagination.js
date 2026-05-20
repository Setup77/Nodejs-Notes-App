/**
 * Fonction globale de pagination responsive avec gestion d'ellipses
 * @param {number} totalPages - Nombre total de pages calculé
 * @param {Array} list - La liste filtrée ou complète des éléments à afficher
 */
function renderPagination(totalPages, list) {
  // Sélection automatique des conteneurs s'ils existent dans la vue active
  const topEl = document.getElementById("paginationTop");
  const bottomEl = document.getElementById("paginationBottom");

  if (topEl) topEl.innerHTML = "";
  if (bottomEl) bottomEl.innerHTML = "";

  // Masquer la pagination si une seule page ou aucune donnée n'est disponible
  if (totalPages <= 1) return;

  const paginations = [topEl, bottomEl].filter((el) => el !== null);

  paginations.forEach((paginationEl) => {
    // 1. BOUTON PRÉCÉDENT
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<button class="page-link" type="button" aria-label="Précédent">&laquo;</button>`;
    if (currentPage > 1) {
      prevLi.onclick = () => {
        currentPage--;
        renderItems(list);
        handleScroll(paginationEl);
      };
    }
    paginationEl.appendChild(prevLi);

    // 2. LOGIQUE DES BLOCS DE PAGES (Fenêtre glissante de 1 bouton autour de la page active)
    const maxVisibleButtons = 1;
    let startPage = Math.max(2, currentPage - maxVisibleButtons);
    let endPage = Math.min(totalPages - 1, currentPage + maxVisibleButtons);

    // Toujours afficher la première page
    appendPageButton(paginationEl, 1, list);

    // Ajouter l'ellipse de début si nécessaire
    if (startPage > 2) {
      appendEllipsis(paginationEl);
    }

    // Afficher les pages centrales
    for (let p = startPage; p <= endPage; p++) {
      appendPageButton(paginationEl, p, list);
    }

    // Ajouter l'ellipse de fin si nécessaire
    if (endPage < totalPages - 1) {
      appendEllipsis(paginationEl);
    }

    // Toujours afficher la dernière page
    if (totalPages > 1) {
      appendPageButton(paginationEl, totalPages, list);
    }

    // 3. BOUTON SUIVANT
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<button class="page-link" type="button" aria-label="Suivant">&raquo;</button>`;
    if (currentPage < totalPages) {
      nextLi.onclick = () => {
        currentPage++;
        renderItems(list);
        handleScroll(paginationEl);
      };
    }
    paginationEl.appendChild(nextLi);
  });
}

/**
 * Génère un bouton numérique individuel
 */
function appendPageButton(container, pageNumber, list) {
  const li = document.createElement("li");
  li.className = `page-item ${pageNumber === currentPage ? "active" : ""}`;
  li.innerHTML = `<button class="page-link" type="button">${pageNumber}</button>`;

  if (pageNumber !== currentPage) {
    li.onclick = () => {
      currentPage = pageNumber;
      renderItems(list);
      handleScroll(container);
    };
  }
  container.appendChild(li);
}

/**
 * Génère un séparateur d'inactivité (...)
 */
function appendEllipsis(container) {
  const li = document.createElement("li");
  li.className = "page-item disabled";
  li.innerHTML = `<span class="page-link">...</span>`;
  container.appendChild(li);
}

/**
 * Gère intelligemment le comportement du défilement
 * Ne remonte l'écran que si l'utilisateur clique sur la pagination du bas
 */
function handleScroll(clickedContainer) {
  if (clickedContainer.id === "paginationBottom") {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}
