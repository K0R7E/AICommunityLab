(() => {
  try {
    const storageKey = "aicl.theme";
    let theme = localStorage.getItem(storageKey);
    if (theme !== "light" && theme !== "dark") {
      theme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    }
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
