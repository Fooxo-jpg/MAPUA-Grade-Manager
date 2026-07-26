// A tiny page -> handler registry so the global Ctrl+N / Cmd+N shortcut in
// App.jsx can trigger "create new" on whichever page is currently active,
// without each page needing to lift its add-form state up to App.jsx.
const registry = {};

export function registerNewItemHandler(page, handler) {
  registry[page] = handler;
}

export function unregisterNewItemHandler(page) {
  delete registry[page];
}

export function getNewItemHandler(page) {
  return registry[page];
}
