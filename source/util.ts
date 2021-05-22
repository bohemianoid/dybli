import { BrowserWindow } from 'electron';
import { is } from 'electron-util';

export function getWindow(): BrowserWindow {
  const [win] = BrowserWindow.getAllWindows();

  return win;
}

export function sendAction(action: string, ...args: unknown[]): void {
  const win = getWindow();

  if (is.macos) {
    win.restore();
  }

  win.webContents.send(action, ...args);
}
