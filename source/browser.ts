import { ipcRenderer as ipc } from 'electron';
import {
  api,
  is
} from 'electron-util';
import config from './config';

ipc.on('show-preferences', async () => {
  const settingsButton = document.querySelector<HTMLElement>(
    '#btnSettingsArea'
  );

  if (isPreferecesOpen() || !settingsButton) {
    return;
  }

  (settingsButton as HTMLElement).click();
});

ipc.on('show-subscription', async() => {
  const subscriptionButton = document.querySelector<HTMLElement>('#btnAbo');

  if (isSubscriptionOpen() || !subscriptionButton) {
    return;
  }

  (subscriptionButton as HTMLElement).click();
});

ipc.on('new-message', async () => {
  const newMessageMenu = document.querySelector<HTMLElement>(
    '#menu_newmessage'
  );

  if (newMessageMenu) {
    (newMessageMenu as HTMLElement).click();
  }
});

ipc.on('log-out', async () => {
  const logOutElement = document.querySelector<HTMLElement>('.u_var_logout');

  if (logOutElement) {
    (logOutElement as HTMLElement).click();
  }
});

function setDarkMode(): void {
  if (is.macos && config.get('followSystemAppearance')) {
    document.documentElement.classList.toggle(
      'dark-mode', api.systemPreferences.isDarkMode()
    );
  } else {
    document.documentElement.classList.toggle(
      'dark-mode', config.get('darkMode')
    );
  }
}

ipc.on('set-dark-mode', setDarkMode);

function isPreferecesOpen(): boolean {
  return Boolean(
    document.querySelector<HTMLElement>('#btnSettingsArea.switchBarBtnSelected')
  );
}

function isSubscriptionOpen(): boolean {
  return Boolean(
    document.querySelector<HTMLElement>('#btnAbo.switchBarBtnSelected')
  )
}

document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector<HTMLElement>('#mainContent');

  if (mainContent) {
    const lastUnit = mainContent.querySelector<HTMLElement>('.lastUnit');
    const top = mainContent.querySelector<HTMLElement>('.top');

    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    mainContent.prepend(toolbar);
    toolbar.append(top, lastUnit);
  }

  const isSwissIdAuth = (hostname: string): boolean => {
    return hostname === 'login.swissid.ch';
  }

  document.documentElement.classList.toggle(
    'swissid', isSwissIdAuth(location.hostname)
  );

  const isSorry = (title: string): boolean => {
    return title === 'sorry.post.ch';
  }

  document.documentElement.classList.toggle(
    'sorry', isSorry(document.title)
  );

  const isMaintenance = (pathname: string): boolean => {
    return pathname.endsWith('/Maintenance');
  }

  document.documentElement.classList.toggle(
    'maintenance', isMaintenance(location.pathname)
  );

  setDarkMode();
});
