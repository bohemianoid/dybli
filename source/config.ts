import Store from 'electron-store';

const defaults = {
  darkMode: false,
  followSystemAppearance: true,
  lastWindowState: {
    height: 600,
    width: 800,
    x: undefined as number | undefined,
    y: undefined as number | undefined
  },
  launchMinimized: false,
  quitOnWindowClose: false
};

const store = new Store({ defaults });

export default store;
