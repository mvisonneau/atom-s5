'use babel';

import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,

  config: {
    "vaultAddr": {
      "description": "Address of the Vault server you want to use",
      "type": "string",
      "default": "http://localhost:8200"
    },
    "vaultToken": {
      "description": "Token to use in order to authenticate against Vault",
      "type": "string",
      "default": ""
    },
    "vaultTransitKey": {
      "description": "Name of the transit key to use for cipher/decipher text",
      "type": "string",
      "default": "default"
    },
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      's5:cipher':   () => this.s5('cipher'),
      's5:decipher': () => this.s5('decipher')
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  s5(command) {
    var shell = require('shelljs') ;

    if (!shell.which('s5')) {
      atom.notifications.addError('s5 command not found in $PATH')
      return ;
    }

    let editor
    editor = atom.workspace.getActiveTextEditor()

    switch(command) {
      case 'cipher': case 'decipher':
        shell.exec(
          'echo \''+ editor.getSelectedText() +'\' | s5 --vault-addr="'+ atom.config.get('s5.vaultAddr') +
          '" --vault-token="'+ atom.config.get('s5.vaultToken') +
          '" --transit-key="'+'"' + atom.config.get('s5.vaultTransitKey'),
          function(code, stdout, stderr) {
            if (code !== 0) {
              atom.notifications.addError('s5 error : ' + stdout + stderr )
              return ;
            } else {
              editor.insertText(stdout)
            }
          });
        break;
      default:
        atom.notifications.addError('undefined command : ' + command)
        return ;
    }
  }
};
