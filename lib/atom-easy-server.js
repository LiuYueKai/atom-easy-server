'use babel';

import path from 'path';
import fs from 'fs';
import url from 'url';
import { BufferedProcess, CompositeDisposable } from 'atom';
import { remote } from 'electron';
import JSON5 from 'json5';

const packagePath = atom.packages.resolvePackagePath('atom-easy-server');
const liveServer = path.join(packagePath, '/node_modules/live-server/live-server.js');
const node = path.resolve(process.env.NODE_PATH, '../../app/apm/bin/node');

let serverProcess;
let disposeMenu;
let noBrowser;

function addStartMenu() {
  disposeMenu = atom.menu.add(
    [{
      label: 'Packages',
      submenu : [{
        label: 'atom-easy-server',
        submenu : [{
          label: 'Start server',
          command: `atom-easy-server:startServer`
        }]
      }]
    }]
  );
}

export default {
  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-easy-server:start-3000': () => this.startServer(3000),
      'atom-easy-server:start-4000': () => this.startServer(4000),
      'atom-easy-server:start-5000': () => this.startServer(5000),
      'atom-easy-server:start-8000': () => this.startServer(8000),
      'atom-easy-server:start-9000': () => this.startServer(9000),
      'atom-easy-server:startServer': () => this.startServer(),
      'atom-easy-server:stopServer': () => this.stopServer(),
      'atom-easy-server:view': () => this.view()
    }));

    addStartMenu();
  },

  deactivate() {
    this.stopServer();
    this.subscriptions.dispose();
  },
  view(port = 3000) {
    if (serverProcess) {
      serverProcess.kill()
    }

    // const targetPath = atom.project.getPaths()[0];
    const targetPath = atom.project.getPaths()[0];
    const allPath = atom.workspace.getActivePane().getActiveItem().getPath();
    const urlParh = allPath.replace(targetPath,'');
    // const targetPath = allPath
    if (!targetPath) {
      atom.notifications.addWarning('[Live Server] You haven\'t opened a Project, you must open one.')
      return;
    }

    noBrowser = false;
    const args = [];
    const stdout = output => {
      if (output.indexOf('Serving ') === 0) {
        const serverUrl = output.split(' at ')[1];
        const port = url.parse(serverUrl).port;
        const disposeStartMenu = disposeMenu;
        disposeMenu = atom.menu.add(
          [{
            label: 'Packages',
            submenu : [{
              label: 'atom-easy-server',
              submenu : [{
                label: output.replace('Serving ', 'Stop '),
                command: `atom-easy-server:stopServer`
              }]
            }]
          }]
        );

        disposeStartMenu.dispose();

        if (noBrowser) {
          atom.notifications.addSuccess(`[Live Server] Live server started at ${serverUrl}.`);
        }
      }

      console.log(output);
    };

    const exit = code => console.log(`live-server exited with code ${code}`);

    fs.open(path.join(targetPath, '.atom-easy-server.json'), 'r', (err, fd) => {
      if (!err) {
        const userConfig = JSON5.parse(fs.readFileSync(fd, 'utf8'));

        Object.keys(userConfig).forEach(key => {
          if (key === 'no-browser') {
            if (userConfig[key] === true) {
              args.push(`--${key}`);
              noBrowser = true;
            }
          } else {
            args.push(`--${key}=${userConfig[key]}`);
          }
        });
      }

      if (!args.length) {
        args.push(`--port=${port}`);
      }
      args.push(`--open=${urlParh}`);

      args.unshift(liveServer);

      serverProcess = new BufferedProcess({
        command: node,
        args,
        stdout,
        exit,
        options: {
          cwd: targetPath,
        }
      });

      console.info(`live-server ${args.join(' ')}`);
    });
  },
  startServer(port = 3000) {
    if (serverProcess) {
      return;
    }

    const targetPath = atom.project.getPaths()[0];

    if (!targetPath) {
      atom.notifications.addWarning('[Live Server] You haven\'t opened a Project, you must open one.')
      return;
    }

    noBrowser = false;
    const args = [];
    const stdout = output => {
      if (output.indexOf('Serving ') === 0) {
        const serverUrl = output.split(' at ')[1];
        const port = url.parse(serverUrl).port;
        const disposeStartMenu = disposeMenu;
        disposeMenu = atom.menu.add(
          [{
            label: 'Packages',
            submenu : [{
              label: 'atom-easy-server',
              submenu : [{
                label: output.replace('Serving ', 'Stop '),
                command: `atom-easy-server:stopServer`
              }]
            }]
          }]
        );

        disposeStartMenu.dispose();

        if (noBrowser) {
          atom.notifications.addSuccess(`[Live Server] Live server started at ${serverUrl}.`);
        }
      }

      console.log(output);
    };

    const exit = code => console.log(`live-server exited with code ${code}`);

    fs.open(path.join(targetPath, '.atom-easy-server.json'), 'r', (err, fd) => {
      if (!err) {
        const userConfig = JSON5.parse(fs.readFileSync(fd, 'utf8'));

        Object.keys(userConfig).forEach(key => {
          if (key === 'no-browser') {
            if (userConfig[key] === true) {
              args.push(`--${key}`);
              noBrowser = true;
            }
          } else {
            args.push(`--${key}=${userConfig[key]}`);
          }
        });
      }

      if (!args.length) {
        args.push(`--port=${port}`);
      }

      args.unshift(liveServer);

      serverProcess = new BufferedProcess({
        command: node,
        args,
        stdout,
        exit,
        options: {
          cwd: targetPath,
        }
      });

      console.info(`live-server ${args.join(' ')}`);
    });
  },

  stopServer() {
    if (serverProcess) {
      console.info('Stopping live-server.');
      serverProcess.kill();
      serverProcess = null;
      const disposeStopMenu = disposeMenu;
      addStartMenu();
      disposeStopMenu.dispose();
      atom.notifications.addSuccess('[Live Server] Live server is stopped.')
    }
  }
};
