import {
  app,
  Menu,
  MenuItemConstructorOptions,
  shell
} from 'electron';
import {
  appMenu,
  is,
  openUrlMenuItem
} from 'electron-util';
import config from './config';
import { sendAction } from './util';

export default async function updateMenu(): Promise<Menu> {
  const newMessageItem: MenuItemConstructorOptions = {
    label: 'New Message',
    accelerator: 'CommandOrControl+N',
    click() {
      sendAction('new-message');
    }
  };

  const logOutItem: MenuItemConstructorOptions = {
    label: 'Log Out',
    click() {
      sendAction('log-out');
    }
  };

  const subscriptionItem: MenuItemConstructorOptions = {
    label: 'Subscription...',
    click() {
      sendAction('show-subscription');
    }
  }

  const preferencesSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Launch at Login',
      visible: is.macos || is.windows,
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click(menuItem) {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: menuItem.checked
        });
      }
    },
    {
      label: 'Lanuch Minimized',
      type: 'checkbox',
      visible: !is.macos,
      checked: config.get('launchMinimized'),
      click() {
        config.set('launchMinimized', !config.get('launchMinimized'));
      }
    },
    {
      label: 'Quit on Window Close',
      type: 'checkbox',
      checked: config.get('quitOnWindowClose'),
      click() {
        config.set('quitOnWindowClose', !config.get('quitOnWindowClose'));
      }
    }
  ];

  const viewSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Follow System Appearance',
      type: 'checkbox',
      visible: is.macos,
      checked: config.get('followSystemAppearance'),
      async click() {
        config.set(
          'followSystemAppearance', !config.get('followSystemAppearance')
        );
        sendAction('set-dark-mode');
        await updateMenu();
      }
    },
    {
      label: 'Dark Mode',
      type: 'checkbox',
      checked: config.get('darkMode'),
      enabled: !is.macos || !config.get('followSystemAppearance'),
      accelerator: 'CommandOrControl+D',
      click() {
        config.set('darkMode', !config.get('darkMode'));
        sendAction('set-dark-mode');
      }
    }
  ];

  const debugSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Show Settings',
      click() {
        config.openInEditor();
      }
    },
    {
      label: 'Show App Data',
      click() {
        shell.openItem(app.getPath('userData'));
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete Settings',
      click() {
        config.clear();
        app.relaunch();
        app.quit();
      }
    },
    {
      label: 'Delete App Data',
      click() {
        shell.moveItemToTrash(app.getPath('userData'));
        app.relaunch();
        app.quit();
      }
    }
  ];

  const macosTemplate: MenuItemConstructorOptions[] = [
    appMenu([
      {
        label: 'Dybli Preferences',
        submenu: preferencesSubmenu
      },
      {
        label: 'E-Post Office Preferences...',
        accelerator: 'Command+,',
        click() {
          sendAction('show-preferences');
        }
      },
      subscriptionItem,
      {
        type: 'separator'
      },
      logOutItem
    ]),
    {
      // @ts-ignore buggy Electron types
      role: 'fileMenu',
      submenu: [
        newMessageItem,
        {
          type: 'separator'
        },
        {
          role: 'close'
        }
      ]
    },
    {
      // @ts-ignore buggy Electron types
      role: 'editMenu'
    },
    {
      // @ts-ignore buggy Electron types
      role: 'viewMenu',
      submenu: viewSubmenu
    },
    {
      // @ts-ignore buggy Electron types
      role: 'windowMenu'
    }
  ];

  const linuxWindowsTemplate: MenuItemConstructorOptions[] = [
    {
      // @ts-ignore buggy Electron types
      role: 'fileMenu',
      submenu: [
        newMessageItem,
        {
          type: 'separator'
        },
        {
          label: 'Dybli Settings',
          submenu: preferencesSubmenu
        },
        {
          label: 'E-Post Office Settings',
          accelerator: 'Control+,',
          click() {
            sendAction('show-preferences');
          }
        },
        subscriptionItem,
        {
          type: 'separator'
        },
        logOutItem,
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    },
    {
      // @ts-ignore buggy Electron types
      role: 'editMenu'
    },
    {
      // @ts-ignore buggy Electron types
      role: 'viewMenu',
      submenu: viewSubmenu
    }
  ];

  const template = is.macos ? macosTemplate : linuxWindowsTemplate;

  if (is.development) {
    template.push({
      label: 'Debug',
      submenu: debugSubmenu
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  return menu;
}
