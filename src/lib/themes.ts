export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    sub: string;
    subAlt: string;
    text: string;
    main: string;
    error: string;
    errorExtra: string;
  };
}

export const themes: Theme[] = [
  {
    id: "obsidian",
    name: "obsidian",
    colors: {
      bg: "#0e1014",
      sub: "#3a4150",
      subAlt: "#161922",
      text: "#e8ecf4",
      main: "#7aa2f7",
      error: "#f7768e",
      errorExtra: "#914550",
    },
  },
  {
    id: "gold-noir",
    name: "gold noir",
    colors: {
      bg: "#0f0f0f",
      sub: "#4d4636",
      subAlt: "#171410",
      text: "#f3ead3",
      main: "#d4af37",
      error: "#c1440e",
      errorExtra: "#6e2708",
    },
  },
  {
    id: "emerald",
    name: "emerald",
    colors: {
      bg: "#0c1512",
      sub: "#3d5249",
      subAlt: "#11201a",
      text: "#e6f2ec",
      main: "#34d399",
      error: "#f87171",
      errorExtra: "#7f3535",
    },
  },
  {
    id: "sunset",
    name: "sunset",
    colors: {
      bg: "#1a1216",
      sub: "#6b4a55",
      subAlt: "#221820",
      text: "#fbe9e7",
      main: "#ff7e5f",
      error: "#ff4365",
      errorExtra: "#8c2438",
    },
  },
  {
    id: "carbon",
    name: "carbon",
    colors: {
      bg: "#313131",
      sub: "#616161",
      subAlt: "#2b2b2b",
      text: "#f5e0dc",
      main: "#f8cb2e",
      error: "#da3333",
      errorExtra: "#791717",
    },
  },
  {
    id: "serika-dark",
    name: "serika dark",
    colors: {
      bg: "#323437",
      sub: "#646669",
      subAlt: "#2c2e31",
      text: "#d1d0c5",
      main: "#e2b714",
      error: "#ca4754",
      errorExtra: "#7e2a33",
    },
  },
  {
    id: "dracula",
    name: "dracula",
    colors: {
      bg: "#282a36",
      sub: "#6272a4",
      subAlt: "#21222c",
      text: "#f8f8f2",
      main: "#bd93f9",
      error: "#ff5555",
      errorExtra: "#ff79c6",
    },
  },
  {
    id: "nord",
    name: "nord",
    colors: {
      bg: "#2e3440",
      sub: "#4c566a",
      subAlt: "#272c36",
      text: "#d8dee9",
      main: "#88c0d0",
      error: "#bf616a",
      errorExtra: "#7d3a40",
    },
  },
  {
    id: "matrix",
    name: "matrix",
    colors: {
      bg: "#000000",
      sub: "#136501",
      subAlt: "#0a0a0a",
      text: "#15ff00",
      main: "#15ff00",
      error: "#d70000",
      errorExtra: "#7d0000",
    },
  },
  {
    id: "rose-pine",
    name: "rosé pine",
    colors: {
      bg: "#191724",
      sub: "#6e6a86",
      subAlt: "#1f1d2e",
      text: "#e0def4",
      main: "#ebbcba",
      error: "#eb6f92",
      errorExtra: "#9d4b63",
    },
  },
  {
    id: "miami",
    name: "miami",
    colors: {
      bg: "#18181a",
      sub: "#e4609b",
      subAlt: "#0f0f10",
      text: "#f24aa0",
      main: "#05dfd7",
      error: "#fd3d6b",
      errorExtra: "#a32847",
    },
  },
  {
    id: "paper",
    name: "paper",
    colors: {
      bg: "#eeeeee",
      sub: "#aaaaaa",
      subAlt: "#e0e0e0",
      text: "#444444",
      main: "#444444",
      error: "#d70000",
      errorExtra: "#a30000",
    },
  },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty("--bg", c.bg);
  root.style.setProperty("--sub", c.sub);
  root.style.setProperty("--sub-alt", c.subAlt);
  root.style.setProperty("--text", c.text);
  root.style.setProperty("--main", c.main);
  root.style.setProperty("--error", c.error);
  root.style.setProperty("--error-extra", c.errorExtra);
}
