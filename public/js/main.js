const btnScrollTop = document.getElementById("btnScrollTop");

if (btnScrollTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      // On utilise flex pour que les classes d'alignement fonctionnent
      btnScrollTop.style.display = "flex";
      btnScrollTop.style.alignItems = "center";
      btnScrollTop.style.justifyContent = "center";
    } else {
      btnScrollTop.style.display = "none";
    }
  });

  btnScrollTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

function formatFacebookDate(dateInput) {
  const now = new Date();
  const date = new Date(dateInput);
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) {
    return "À l'instant";
  } else if (diffSeconds < 3600) {
    // moins d’une heure
    const minutes = Math.floor(diffSeconds / 60);
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else if (diffSeconds < 86400) {
    // moins de 24h
    const hours = Math.floor(diffSeconds / 3600);
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  } else if (diffSeconds < 172800) {
    // moins de 48h => hier
    return "Hier";
  } else if (diffSeconds < 604800) {
    // moins de 7 jours
    const days = Math.floor(diffSeconds / 86400);
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  } else {
    // plus ancien => format JJ/MM/YYYY
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `Le ${day}/${month}/${year}`;
  }
}
