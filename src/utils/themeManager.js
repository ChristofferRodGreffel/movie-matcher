class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem("theme") || "light";
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add new theme class
    root.classList.add(theme);

    // Set data attribute for CSS selectors
    root.setAttribute("data-theme", theme);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }

  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    return newTheme;
  }

  getCurrentTheme() {
    return localStorage.getItem("theme") || "light";
  }

  // Check if dark mode is enabled
  isDarkMode() {
    return this.getCurrentTheme() === "dark";
  }

  // Listen for theme changes
  onThemeChange(callback) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          callback(this.getCurrentTheme());
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return observer;
  }
}

export default new ThemeManager();
