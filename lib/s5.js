'use babel';

import { CompositeDisposable } from 'atom';

const shell = require('shelljs');

export default {

  subscriptions: null,

  config: {
    "provider": {
      "description": "Secret provider to use for ciphering",
      "type": "string",
      "default": "aes",
      "enum": [
        {"value": "aes", "description": "Use AES-GCM as the encryption backend"},
        {"value": "aws-kms", "description": "Use AWS-KMS as the encryption backend"},
        {"value": "gcp-kms", "description": "Use GCP-KMS as the encryption backend"},
        {"value": "pgp", "description": "Use PGP as the encryption backend"},
        {"value": "vault", "description": "Use Vault as the encryption backend"},
      ]
    },
    "aes.key": {
      "description": "Key for AES encryption",
      "type": "string",
      "default": ""
    },
    "aws.accessKeyID": {
      "description": "AWS Access Key ID to use for authenticating agains AWS API",
      "type": "string",
      "default": ""
    },
    "aws.kmsKeyARN": {
      "description": "AWS KMS Key to use for encryption",
      "type": "string",
      "default": ""
    },
    "aws.secretAccessKey": {
      "description": "AWS Secret Access Key to use for authenticating agains AWS API",
      "type": "string",
      "default": ""
    },
    "aws.sessionToken": {
      "description": "AWS Session Token to use for authenticating agains AWS API",
      "type": "string",
      "default": ""
    },
    "gcp.kmsKeyName": {
      "description": "GCP KMS Key to use for encryption",
      "type": "string",
      "default": ""
    },
    "pgp.publicKeyPath": {
      "description": "Public PGP key to use for encryption",
      "type": "string",
      "default": ""
    },
    "pgp.privateKeyPath": {
      "description": "Private PGP key to use for encryption",
      "type": "string",
      "default": ""
    },
    "vault.address": {
      "description": "Address of the Vault server you want to use",
      "type": "string",
      "default": "http://localhost:8200"
    },
    "vault.token": {
      "description": "Token to use in order to authenticate against Vault",
      "type": "string",
      "default": ""
    },
    "vault.transitKey": {
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
      's5:decipher': () => this.s5('decipher'),
      's5:render':   () => this.s5('render')
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  s5(command) {
    if (!shell.which('s5')) {
  		atom.notifications.addError('s5 command not found in $PATH');
  		return;
  	}

  	let provider = atom.config.get('s5.provider');
  	let cmd = 's5 ' + command + ' ' + provider;

  	switch(provider) {
  		case 'aes':
  			cmd += ' --key=' + atom.config.get('s5.aes.key');
  			break;
  		case 'aws':
  			if ( atom.config.get('s5.aws.accessKeyID').length > 0 ) {
  				shell.env["AWS_ACCESS_KEY_ID"] = atom.config.get('s5.aws.accessKeyID');
  			}

  			if ( atom.config.get('s5.aws.secretAccessKey').length > 0 ) {
  				shell.env["AWS_SECRET_ACCESS_KEY"] = atom.config.get('s5.aws.secretAccessKey');
  			}

  			if ( atom.config.get('s5.aws.sessionToken').length > 0 ) {
  				shell.env["AWS_SESSION_TOKEN"] = atom.config.get('s5.aws.sessionToken');
  			}

  			cmd += ' --kms-key-arn=' + atom.config.get('s5.aws.kmsKeyARN');
  			break;
  		case 'gcp':
  			cmd += ' --kms-key-name=' + atom.config.get('s5.gcp.kmsKeyName');
  			break;
  		case 'pgp':
  			shell.env["S5_PGP_PUBLIC_KEY_PATH"] = atom.config.get('s5.pgp.publicKeyPath');
  			shell.env["S5_PGP_PRIVATE_KEY_PATH"] = atom.config.get('s5.pgp.privateKeyPath');
  			break;
  		case 'vault':
  			shell.env["VAULT_TOKEN"] = atom.config.get('s5.vault.address');
  			shell.env["VAULT_ADDRESS"] = atom.config.get('s5.vault.token');
  			cmd += ' --transit-key=' + atom.config.get('s5.vault.transitKey');
  			break;
  	}

    let editor = atom.workspace.getActiveTextEditor();

  	switch(command) {
  		case 'cipher': case 'decipher':
  			cmd += ' <<_EOL_\n' + editor.getSelectedText() + '\n_EOL_';
  			shell.exec(
  				cmd,
  				function(code, stdout, stderr) {
  					if (code !== 0) {
  						atom.notifications.addError('s5 error : ' + cmd + ' - ' + stdout + ' - ' + stderr);
  						return;
  					} else {
  						editor.insertText(stdout);
  					}
  				}
  			);
  			break;
  		case 'render':
        let file = editor.buffer.file;
  			cmd += ' --in-place ' + file.path;
        atom.notifications.addInfo(cmd);
  			shell.exec(
  				cmd,
  				function(code, stdout, stderr) {
  					if (code !== 0) {
  						atom.notifications.addError('s5 error : ' + cmd + ' - ' + stdout + ' - ' + stderr);
  						return;
  					}
  				}
  			);
  			break;
  		default:
  			atom.notifications.addError('undefined command : ' + command);
  			break;
  	}
  }
};
