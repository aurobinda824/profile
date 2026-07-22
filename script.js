const sectionModules = [
    { id: "profile", name: "Profile", html: "sections/profile/section.html" },
    { id: "projects", name: "Projects", html: "sections/projects/section.html" },
    { id: "experience", name: "Experience", html: "sections/experience/section.html" },
    { id: "skills", name: "Skills", html: "sections/skills/section.html" },
    { id: "contact", name: "Contact", html: "sections/contact/section.html" }
];

const menuSections = sectionModules.filter(({ id }) => id !== "profile");
const button = document.getElementById("startButton");
const menu = document.getElementById("menu");
const html = document.documentElement;
const startSound = new Audio("start.mp3");
const buttonSound = new Audio("button.mp3");
const markupRequests = new Map();

let menuButtons = [];
let sectionWindow;
let renderVersion = 0;
let menuRevealed = false;

function play(sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function loadMarkup(url) {
    if (!markupRequests.has(url)) {
        markupRequests.set(url, fetch(url).then((response) => {
            if (!response.ok) throw new Error(`Unable to load ${url}`);
            return response.text();
        }).catch((error) => {
            markupRequests.delete(url);
            throw error;
        }));
    }
    return markupRequests.get(url);
}

function setTheme(theme) {
    html.dataset.theme = theme;
    localStorage.setItem("portfolio-theme", theme);
}

function initializeProfile() {
    const toggle = sectionWindow.querySelector("#themeToggle");
    if (!toggle) return;

    const updateToggle = () => {
        const isDark = html.dataset.theme === "dark";
        toggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
        toggle.querySelector(".theme-toggle__icon").textContent = isDark ? "☀️" : "🌙";
        toggle.querySelector(".theme-toggle__text").textContent = isDark ? "Light" : "Dark";
    };

    updateToggle();
    toggle.addEventListener("click", () => {
        setTheme(html.dataset.theme === "dark" ? "light" : "dark");
        updateToggle();
    });
}

async function renderSection(id) {
    const section = sectionModules.find((item) => item.id === id);
    if (!section) return;

    const version = ++renderVersion;
    try {
        const markup = await loadMarkup(section.html);
        if (version !== renderVersion) return;

        sectionWindow.innerHTML = markup;
        if (id === "profile") initializeProfile();
        sectionWindow.classList.add("show");
    } catch (error) {
        if (version === renderVersion) sectionWindow.textContent = "This section could not be loaded.";
        console.error(error);
    }
}

function selectSection(id) {
    menuButtons.forEach((item) => item.classList.toggle("active", item.dataset.section === id));
    button.classList.toggle("active", id === "profile");
    renderSection(id);
}

function revealMenu() {
    if (menuRevealed) return;
    menuRevealed = true;
    selectSection("profile");
    requestAnimationFrame(() => menuButtons.forEach((item) => item.classList.add("show")));

    const preload = () => menuSections.forEach(({ html }) => loadMarkup(html).catch(() => {}));
    (window.requestIdleCallback || ((callback) => setTimeout(callback, 0)))(preload);
}

function buildInterface() {
    menuButtons = menuSections.map((section, index) => {
        const item = document.createElement("button");
        item.className = "circle-button menu-btn";
        item.dataset.section = section.id;
        item.textContent = section.name;
        item.style.transitionDelay = `${index * 45}ms`;
        item.addEventListener("click", () => {
            play(buttonSound);
            selectSection(section.id);
        });
        menu.append(item);
        return item;
    });

    sectionWindow = document.createElement("section");
    sectionWindow.id = "sectionWindow";
    document.body.append(sectionWindow);
}

button.addEventListener("click", () => {
    if (!button.classList.contains("open")) {
        play(startSound);
        button.classList.add("open", "morph", "active");
        return;
    }

    play(buttonSound);
    selectSection("profile");
});

button.addEventListener("transitionend", (event) => {
    if (event.target === button && event.propertyName === "transform" && button.classList.contains("open")) revealMenu();
});

const savedTheme = localStorage.getItem("portfolio-theme");
if (savedTheme === "dark") setTheme("dark");
buildInterface();
