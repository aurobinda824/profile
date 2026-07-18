const sectionModules = [
    { id: "profile", name: "Profile", html: "sections/profile/section.html", css: "sections/profile/section.css" },
    { id: "projects", name: "Projects", html: "sections/projects/section.html", css: "sections/projects/section.css" },
    { id: "experience", name: "Experience", html: "sections/experience/section.html", css: "sections/experience/section.css" },
    { id: "skills", name: "Skills", html: "sections/skills/section.html", css: "sections/skills/section.css" },
    { id: "contact", name: "Contact", html: "sections/contact/section.html", css: "sections/contact/section.css" }
];

const sections = new Map(sectionModules.map((section) => [section.id, section]));
const menuSections = sectionModules.filter(({ id }) => id !== "profile");
const button = document.getElementById("startButton");
const menu = document.getElementById("menu");
const html = document.documentElement;
const startSound = new Audio("start.mp3");
const buttonSound = new Audio("button.mp3");
const styleRequests = new Map();
const markupRequests = new Map();

let menuButtons = [];
let sectionWindow;
let renderVersion = 0;
let menuRevealed = false;

function play(sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function loadStyle(url) {
    if (styleRequests.has(url)) return styleRequests.get(url);

    const request = new Promise((resolve, reject) => {
        const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: url });
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", () => {
            styleRequests.delete(url);
            link.remove();
            reject(new Error(`Unable to load ${url}`));
        }, { once: true });
        document.head.append(link);
    });
    styleRequests.set(url, request);
    return request;
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
    const section = sections.get(id);
    if (!section) return;

    const version = ++renderVersion;
    try {
        const [, markup] = await Promise.all([loadStyle(section.css), loadMarkup(section.html)]);
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

    const preload = () => menuSections.forEach((section) => {
        loadStyle(section.css).catch(() => {});
        loadMarkup(section.html).catch(() => {});
    });
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
    sectionWindow.className = "glass-panel";
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
