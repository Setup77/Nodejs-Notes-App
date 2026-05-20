document.addEventListener("DOMContentLoaded", () => {
  let modal = new bootstrap.Modal(document.getElementById("editModal"));
  let toastEl = document.getElementById("liveToast");
  let toast = new bootstrap.Toast(toastEl);
  let currentField = "";

  // 1. ATTACH TO WINDOW TO MAKE IT GLOBAL
  window.openModal = function (field, currentValue) {
    currentField = field;
    document.getElementById("fieldName").value = field;
    document.getElementById("editInput").value = currentValue;
    modal.show();
  };

  // Récupération dynamique du jeton CSRF stocké dans le HTML
  const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  };

  function showToast(message, type = "success") {
    const toastBody = document.getElementById("toastMessage");

    // Icônes dynamiques en fonction du résultat
    const icon =
      type === "success"
        ? '<i class="bi bi-check-circle-fill me-2 fs-5"></i>'
        : '<i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>';
    toastBody.innerHTML = icon + message;

    toastEl.classList.remove("text-bg-success", "text-bg-danger");
    toastEl.classList.add(
      type === "success" ? "text-bg-success" : "text-bg-danger",
    );

    toast.show();
    hideLoader();
  }

  function showLoader() {
    document.getElementById("loadingOverlay").classList.remove("d-none");
  }

  function hideLoader() {
    document.getElementById("loadingOverlay").classList.add("d-none");
  }

  function openModal(field, currentValue) {
    currentField = field;
    document.getElementById("fieldName").value = field;
    document.getElementById("editInput").value = currentValue;
    modal.show();
  }

  // ✅ Sauvegarde d’un champ texte avec injection CSRF
  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const field = document.getElementById("fieldName").value;
    const value = document.getElementById("editInput").value.trim();
    if (!value) return showToast("Le champ ne peut pas être vide.", "error");

    showLoader();

    try {
      const res = await fetch("/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(), // Ajout de la protection CSRF
        },
        body: JSON.stringify({ field, value }),
      });

      const data = await res.json();
      if (data.success) {
        document.getElementById(field + "Field").textContent = value;
        showToast("Mise à jour réussie !");
        modal.hide();
      } else {
        showToast(
          "Erreur : " + (data.error || "mise à jour impossible"),
          "error",
        );
      }
    } catch (err) {
      showToast("Erreur réseau : " + err.message, "error");
    } finally {
      hideLoader();
    }
  });

  // ✅ Gestion de l'upload de l'avatar avec injection CSRF
  document
    .getElementById("avatarInput")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Prévisualisation immédiate
      const preview = document.getElementById("avatarPreview");
      const oldSrc = preview.src;
      preview.src = URL.createObjectURL(file);

      showLoader();

      try {
        const formData = new FormData();
        formData.append("avatar", file);

        const res = await fetch("/upload-avatar", {
          method: "POST",
          headers: {
            "X-CSRF-Token": getCsrfToken(), // Ajout de la protection CSRF
          },
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          showToast("Avatar mis à jour avec succès !");
        } else {
          preview.src = oldSrc; // Restauration de l'ancien si erreur
          showToast("Erreur lors de l'upload : " + data.error, "error");
        }
      } catch (err) {
        preview.src = oldSrc;
        showToast("Erreur réseau : " + err.message, "error");
      } finally {
        hideLoader(); // Correction du loader infini
      }
    });
});
