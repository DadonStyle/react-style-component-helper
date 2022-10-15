/* imports */
const vscode = require('vscode');
const fs = require('fs');

/* vars */
const wsedit = new vscode.WorkspaceEdit();
const fileNameString = 'styled.js'

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	let disposable = vscode.commands.registerCommand('react-style-component-helper.helloWorld', async function () { // this syntax is a template from vscode
		/* varbs */
		const wsPath = vscode.workspace.workspaceFolders[0].uri.fsPath; // gets the path of the first workspace folder
		let tagsArray = [];

		/* validate that the user have any file open while executing the command */
		if (typeof vscode.window.activeTextEditor === typeof undefined) {
			return vscode.window.showInformationMessage('Please enter the required file and try again');
		}

		/* filter the file and return the tags */
		tagsArray = findTagsInCurrentFile(wsPath, tagsArray);
		console.log('returned tag array', tagsArray);
		if (tagsArray <= 0) {
			return vscode.window.showInformationMessage('No tags found, Please make sure to use <S. at the start of the tag');
		}
		const stringTagsArray = tagsArray.join("\n")
		/* get the tags array */
		if (fs.existsSync(wsPath + '/' + fileNameString)) {
			await editStyledFile(wsPath, stringTagsArray);
			return;
		}

		/* create the styled.js file */
		await createStyledFile(wsPath, stringTagsArray);
		return;
	});

	context.subscriptions.push(disposable);
}

function findTagsInCurrentFile() {
	if (vscode.window.activeTextEditor.document.fileName.includes(fileNameString)) {
		return [];
	}
	const regex = /^(<S.)$/g;
	const contents = fs.readFileSync(vscode.window.activeTextEditor.document.fileName, 'utf-8');
	const arrFile = contents.split(/\r?\n/);
	const filterByTag = arrFile.filter((item) => item.includes('<S.'));
	const removeTheTag = filterByTag.map((item) => item.match(regex)); // THIS IS NOT WORKING -> NEED TO CUT THE WORD TO AFTER THE <S. and before the >
	debugger;

	if (fillteredArray.length > 0) {
		return fillteredArray;
	}
	return [];
}

/**
 * @param wsPath -> the path of the current folder
 * @param tagsArray -> the array containing the tags for creating the styled components
 */
async function createStyledFile(wsPath, tagsArray) {
	const styledPath = vscode.Uri.file(wsPath + '/' + fileNameString); // get the full path for the styled
	console.log(vscode.window.activeTextEditor.document.fileName);
	wsedit.createFile(styledPath, { overwrite: false });
	await vscode.workspace.applyEdit(wsedit);

	const data = 
	`
	import styled from \'react-style\';

	${tagsArray}

	export default S {
		bla bla
	}
	`;
	// how to wrigt in a file ?
	fs.writeFileSync(styledPath.fsPath, data, 'utf-8');
	await vscode.workspace.applyEdit(wsedit);
	vscode.window.showInformationMessage('Your styled.js file has been created!');
}

/**
 * @param wsPath -> the path of the current folder
 * @param tagsArray -> the array containing the tags for creating the styled components
 */
async function editStyledFile(wsPath, tagsArray) {
	const styledPath = vscode.Uri.file(wsPath + '/' + fileNameString); // get the full path for the styled
	wsedit.createFile(styledPath, { overwrite: false });
	await vscode.workspace.applyEdit(wsedit);
	const contents = fs.readFileSync(styledPath.fsPath, 'utf-8');
	const arrFile = contents.split(/\r?\n/);
}



// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
