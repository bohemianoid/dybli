import { readFileSync } from 'fs';
import * as path from 'path';
import {
  app,
  BrowserWindow,
  session,
  shell
} from 'electron';
import electronContextMenu from 'electron-context-menu';
import electronDebug from 'electron-debug';
import electronDl from 'electron-dl';
import { darkMode } from 'electron-util';
import config from './config';
import ensureOnline from './ensure-online';
import updateAppMenu from './menu';

electronDebug();
electronDl();
electronContextMenu();

const mainURL = 'https://service.post.ch/epostoffice';

let mainWindow: BrowserWindow;
let isQuitting = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

function setNonResponsive(): void {
  const cookie = {
    url: 'https://service.post.ch/',
    name: 'epof-portal',
    value: encodeURIComponent(JSON.stringify({
      'nonresponsive': true
    }))
  }

  session.defaultSession!.cookies.set(cookie);
}

function createMainWindow(): BrowserWindow {
  const lastWindowState = config.get('lastWindowState');
  const isDarkMode = config.get('darkMode');

  const win = new BrowserWindow({
    darkTheme: isDarkMode,
    height: lastWindowState.height,
    minHeight: 600,
    minWidth: 1140,
    show: false,
    title: app.getName(),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'browser.js')
    },
    width: lastWindowState.width,
    x: lastWindowState.x,
    y: lastWindowState.y
  });

  setNonResponsive();

  darkMode.onChange(() => {
    win.webContents.send('set-dark-mode');
  });

  win.loadURL(mainURL);

  win.on('close', e => {
    if (config.get('quitOnWindowClose')) {
      app.quit();
      return;
    }

    if (!isQuitting) {
      e.preventDefault();

      win.blur();
      win.hide();
    }
  });

  return win;
}

(async () => {
  await Promise.all([
    app.whenReady(),
    ensureOnline()
  ]);

  await updateAppMenu();
  mainWindow = createMainWindow();

  const { webContents } = mainWindow;

  webContents.on('dom-ready', async () => {
    await updateAppMenu();

    webContents.insertCSS(
      readFileSync(path.join(__dirname, '..', 'style', 'browser.css'), 'utf8')
    );
    webContents.insertCSS(
      readFileSync(path.join(__dirname, '..', 'style', 'dark-mode.css'), 'utf8')
    );
    webContents.insertCSS(
      readFileSync(path.join(__dirname, '..', 'style', 'swissid.css'), 'utf8')
    );
    webContents.insertCSS(
      readFileSync(path.join(__dirname, '..', 'style', 'sorry.css'), 'utf8')
    );
    webContents.insertCSS(
      readFileSync(
        path.join(__dirname, '..', 'style', 'maintenance.css'), 'utf8'
      )
    );

    if (
      config.get('launchMinimized')
      || app.getLoginItemSettings().wasOpenedAsHidden
    ) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternalSync(url);
  });

  webContents.on('will-navigate', (event, url) => {
    const isAuth = (url: string): boolean => {
      const authURL = 'https://account.post.ch/idp/';

      return url.startsWith(authURL);
    }

    const isLogOut = (url: string): boolean => {
      const logOutURL = 'https://account.post.ch/logout/';

      return url.startsWith(logOutURL);
    }

    const isRedirect = (url: string): boolean => {
      const redirectURL = 'https://account.post.ch/redirect/';

      return url.startsWith(redirectURL);
    }

    const isPostDotCh = (url: string): boolean => {
      const { hostname } = new URL(url);

      return hostname === 'www.post.ch';
    }

    const isSelfAdmin = (url: string): boolean => {
      const selfAdminURL = 'https://account.post.ch/selfadmin/';

      return url.startsWith(selfAdminURL);
    }

    const isAdvancedSearch = (url: string): boolean => {
      const advancedSearchURL = 'https://service.post.ch/epostoffice/#/AdvancedSearchForm';

      return url.startsWith(advancedSearchURL);
    }

    if (
      isAuth(url)
      || isLogOut(url)
      || isRedirect(url)
      || isAdvancedSearch(url)
    ) {
      return;
    }

    event.preventDefault();

    if (isPostDotCh(url)) {
      webContents.loadURL(mainURL);

      return;
    }

    if (isSelfAdmin(url)) {
      const { protocol, hostname, pathname } = new URL(url);

      shell.openExternalSync(`${protocol}//${hostname}${pathname}`);

      return;
    }

    shell.openExternalSync(url);
  });
})();

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;

  if (mainWindow) {
    config.set('lastWindowState', mainWindow.getNormalBounds());
  }
});
