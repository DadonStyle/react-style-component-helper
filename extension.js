/* imports */
const vscode = require('vscode');
const fs = require('fs');

/* vars */
const wsedit = new vscode.WorkspaceEdit();
const styledConst = 'styled.js'

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('react-style-component-helper.helloWorld', async function () { // this syntax is a template from vscode
		/* varbs */
		const styledFilePath = vscode.Uri.file(vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + styledConst); // gets the path of the styled file
		const currentFilePath = vscode.window.activeTextEditor.document.fileName; // gets the path of the current path

		/* validate that the user have any file open while executing the command */
		if (typeof vscode.window.activeTextEditor === typeof undefined) {
			return vscode.window.showInformationMessage('Please enter the required file and try again');
		}

		/* filter the file and return the tags and the number of lines*/
		const tagsObject = findTagsInCurrentFile(currentFilePath, '<S.', '>');
		if (tagsObject.relevantTags <= 0 || tagsObject <= 0) {
			return;
		}
		/* get the tags array */
		if (fs.existsSync(styledFilePath.fsPath)) {
			const styledTagsObject = findTagsInCurrentFile(styledFilePath.fsPath, 'const', '=');
			if (tagsObject.relevantTags <= 0 || styledTagsObject <= 0) {
				return;
			}
			await editStyledFile(styledFilePath, styledTagsObject.relevantTags, styledTagsObject.numOflines); // makes the code more readable
			return;
		}
		/* create the styled.js file */
		await createStyledFile(styledFilePath, tagsObject.relevantTags);
		return;
	});

	context.subscriptions.push(disposable);
}

/**
 * @param path -> the path for the relevant file
 */
function findTagsInCurrentFile(path, fromSymbol, toSymbol) {
	if (vscode.window.activeTextEditor.document.fileName.includes(styledConst)) { // check the current open file
		vscode.window.showErrorMessage('Please open the relevant file, not styled.js');
		return [];
	}

	const contents = fs.readFileSync(path, 'utf-8');
	const arrFile = contents.split(/\r?\n/);
	const numOflines = 20; // TODO
	const filterByTag = arrFile.filter((item) => item.includes(fromSymbol));
	const removeTheTag = filterByTag.map((item) => item.split(fromSymbol).pop().split(toSymbol)[0].trim());
	const relevantTags =  Array.from(new Set(removeTheTag));

	if (relevantTags.length > 0 && numOflines > 0) {
		return { relevantTags, numOflines };
	}
	vscode.window.showErrorMessage('No tags found, Please make sure to use <S. at the start of the tag');
	return [];
}

/**
 * @param pathStyled -> the path of the *future* styled.js
 * @param tagsArray -> the array containing the tags for creating the styled components
 */
async function createStyledFile(pathStyled, tagsArray) {
	wsedit.createFile(pathStyled, { overwrite: false });
	await vscode.workspace.applyEdit(wsedit);

	// data need to not contain tabs in this file to look good on the target file
	const data =`
import styled from \'react-style\';
${tagsArray.map((item) => `\nconst ${item} = styled.div\`
display: flex;
\`;\n`).join('')}
export default S = {
${tagsArray.map((item) => `${item},\n`).join('')}
};
`;

	fs.writeFileSync(pathStyled.fsPath, data, 'utf-8'); // create the file
	await vscode.workspace.applyEdit(wsedit); // finilazing the edit
	vscode.window.showInformationMessage('Your styled.js file has been created!');
}

/**
 * @param pathStyled -> the path of the *existing* styled.js
 * @param tagsArray -> the array containing the tags for creating the styled components
 */
// TODO: bc i cant know where to start and close the ``; (the user can have those in the mid of the component)
// need to edit the new components after the end of their file, (the user will need to copy paste to the location)
async function editStyledFile(pathStyled, tagsArray, numOfLines) {
	// const existingTags = tagsArray.filter((item) => )

	// data need to not contain tabs in this file to look good on the target file
	const data =`

`;

	// fs.writeFileSync(pathStyled.fsPath, data, 'utf-8');
	// await vscode.workspace.applyEdit(wsedit);
	vscode.window.showInformationMessage('Your styled.js file has been edited!');
}



// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
