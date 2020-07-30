const themes = {
    // https://coolors.co/9a8f97-c3baba-e9e3e6-b2b2b2-736f72
    business: {
        "--color-1": "hsla(315, 2%, 44%, 1)", /* sonic-silver */
        "--color-2": "hsla(316, 5%, 58%, 1)", /* heliotrope-gray */
        "--color-3": "hsla(0, 0%, 70%, 1)", /* silver-chalice */
        "--color-4": "hsla(0, 7%, 75%, 1)", /* pale-silver */
        "--color-5": "hsla(330, 12%, 90%, 1)" /* platinum */
    },
    // https://coolors.co/252323-70798c-f5f1ed-dad2bc-a99985
    pastel: {
        "--color-1": "hsla(0, 3%, 14%, 1)",
        "--color-2": "hsla(221, 11%, 49%, 1)",
        "--color-3": "hsla(33, 17%, 59%, 1)",
        "--color-4": "hsla(44, 29%, 80%, 1)",
        "--color-5": "hsla(30, 29%, 95%, 1)"
    }
}

const activateTheme = (name) => {
    const theme = themes[name];

    Object.keys(theme).forEach(color => {
        document.documentElement.style.setProperty(color, theme[color]);
    });

    localStorage.setItem("theme", name);
}

document.addEventListener("DOMContentLoaded", () => {
    // theme selector
    const themeSelect = document.getElementById("theme");

    if (themeSelect) {
        const persistedSelect = localStorage.getItem("theme") || 'business';
        activateTheme(persistedSelect)
        themeSelect.value = persistedSelect;

        themeSelect.onchange = (e) => {
            activateTheme(e.target.value);
        };
    }
});