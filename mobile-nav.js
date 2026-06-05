/**
 * Mobile navigation — hamburger menu for public pages & admin sidebar
 */
(function () {
  function closeMenu(toggle, menu, overlay) {
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (menu) menu.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function openMenu(toggle, menu, overlay) {
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (menu) menu.classList.add("open");
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function initPublicNav() {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("navbarMenu");
    const overlay = document.getElementById("navOverlay");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.contains("open");
      if (isOpen) closeMenu(toggle, menu, overlay);
      else openMenu(toggle, menu, overlay);
    });

    if (overlay) {
      overlay.addEventListener("click", () => closeMenu(toggle, menu, overlay));
    }

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu(toggle, menu, overlay));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu(toggle, menu, overlay);
    });
  }

  function initAdminNav() {
    const toggle = document.getElementById("adminMenuToggle");
    const sidebar = document.querySelector(".admin-app .sidebar");
    const overlay = document.getElementById("adminOverlay");
    if (!toggle || !sidebar) return;

    toggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("open");
      sidebar.classList.toggle("open", !isOpen);
      if (overlay) overlay.classList.toggle("open", !isOpen);
      document.body.style.overflow = isOpen ? "" : "hidden";
    });

    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      });
    }

    sidebar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("open");
        document.body.style.overflow = "";
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) {
        sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  }

  function init() {
    initPublicNav();
    initAdminNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
