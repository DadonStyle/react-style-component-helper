// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	console.log('start');
	let disposable = vscode.commands.registerCommand('react-style-component-helper.helloWorld', async function () {
		const wsedit = new vscode.WorkspaceEdit();
		const wsPath = vscode.workspace.workspaceFolders[0].uri.fsPath; // gets the path of the first workspace folder
		const filePath = vscode.Uri.file(wsPath + '/styled.js');
		// if (fs.existsSync(wsPath + '/styled.js')) {
		// 	vscode.window.showInformationMessage('Your file already created!');
		// 	// wsedit.deleteFile(filePath);
		// }
		wsedit.createFile(filePath, { overwrite: false });
		await vscode.workspace.applyEdit(wsedit);
		if (typeof vscode.window.activeTextEditor === typeof undefined) {
			 return vscode.window.showInformationMessage('Please enter the required file and try again');
		}
		const contents = fs.readFileSync(vscode.window.activeTextEditor.document.fileName, 'utf-8');
		const arrFile = contents.split(/\r?\n/);
		console.log('Im the file name', vscode.window.activeTextEditor.document.fileName);
		console.log('File Array', arrFile[1]);
		vscode.window.showInformationMessage('Your styled.js file has been created!');
	});

	context.subscriptions.push(disposable);
}

function checkIfOnValidFile(path) {
	// need to check if the user activate the command on the right jsx file 
	// search using regex the "<S." and make sure their is matching in the other file or something
}

//PLAN
//user will issue the command on the right file
//the extantion command will create the style file for him 
//a lot of use with regex to make sure the file have all the right properties in it
// note: make sure it will support existing file ! (if the user already have styled.js with content we dont wanna delete it but replace or edit)

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
