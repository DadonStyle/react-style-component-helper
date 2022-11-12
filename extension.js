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
	let disposable = vscode.commands.registerCommand('react-style-component-helper.generateStyled', async function () { // this syntax is a template from vscode
		/* validate that the user have any file open while executing the command */
		if (typeof vscode.window.activeTextEditor === typeof undefined) {
			return vscode.window.showInformationMessage('Please enter the required file and try again');
		}
		/* validate that the user is not on the styled js file */
		if (vscode.window.activeTextEditor.document.fileName.includes(styledConst)) { // check the current open file
			vscode.window.showErrorMessage('Please open the file to create from, not styled.js');
			return [];
		}
		/* varbs */
		const styledFilePath = vscode.Uri.file(vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + styledConst); // gets the path of the styled file
		const currentFilePath = vscode.window.activeTextEditor.document.fileName; // gets the path of the current path
		/* filter the file and return the tags and the number of lines*/
		const tagsObject = findTagsInCurrentFile(currentFilePath, '<S.', '>');
		if (!tagsObject.relevantTags || tagsObject.relevantTags.length <= 0) {
			vscode.window.showErrorMessage('No tags found, Please make sure to use <S. at the start of the tag');
			return;
		}
		/* check if styled.js file already exist */
		if (fs.existsSync(styledFilePath.fsPath)) {
			let relevantTags = tagsObject.relevantTags;
			const styledTagsObject = findTagsInCurrentFile(styledFilePath.fsPath, 'const', '=');
			if (styledTagsObject.relevantTags && styledTagsObject.relevantTags.length > 0) {
				relevantTags = handleDuplicate(styledTagsObject.relevantTags, tagsObject.relevantTags);
			}
			await editStyledFile(styledFilePath.fsPath, relevantTags, styledTagsObject.numOflines);
			return;
		}
		/* create the styled.js file */
		await createStyledFile(styledFilePath, tagsObject.relevantTags);
		return;
	});

	context.subscriptions.push(disposable);
}

/**
 * @param styledArr -> tags that been found in the styled.js file
 * @param fileArr -> tags that been found in the file
 */
function handleDuplicate(styledArr, fileArr) {
	const duplicateMap = new Map(styledArr.map((item) => [item, item]));
	let returnedTags = [];
	fileArr.forEach((item
		) => {
			if(duplicateMap.get(item)){
				return;
			}
			returnedTags.push(item);
		});
	return returnedTags;
}

/**
 * @param path -> the path for the relevant file
 * @param fromSymbol -> where to start cut
 * @param toSymbol -> where to stop cut
 */
function findTagsInCurrentFile(path, fromSymbol, toSymbol) {
	let relevantTags = [];
	let numOflines = 1; // even if the file is empty the first line will be empty string so its 1
	const contents = fs.readFileSync(path, 'utf-8');
	const arrFile = contents.split(/\r?\n/);
	numOflines = arrFile.length;
	const filterByTag = arrFile.filter((item) => item.includes(fromSymbol));
	const removeTheTag = filterByTag.map((item) => item.split(fromSymbol).pop().split(toSymbol)[0].trim());
	relevantTags =  Array.from(new Set(removeTheTag));

	return { relevantTags, numOflines };
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
import styled from \'styled-components/macro\';
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
 * @param numOfLines -> number of lines in the file
 */

async function editStyledFile(pathStyled, tagsArray, numOfLines) {
	const contents = fs.readFileSync(pathStyled, 'utf-8');
	const arrFile = contents.split(/\r?\n/);
	if (tagsArray.length < 1) {
		vscode.window.showInformationMessage('No differences has been found');
		return;
	}

	// data need to not contain tabs in this file to look good on the target file
	const data =`
${arrFile.map((item) => `${item} \n`).join('')}
${numOfLines > 1 ? '' : 'import styled from \'styled-components/macro\';'}
${tagsArray.map((item) => `\nconst ${item} = styled.div\`
display: flex;
\`;\n`).join('')}
export default S = {
${tagsArray.map((item) => `${item},\n`).join('')}
};

`;
	fs.writeFileSync(pathStyled, data, 'utf-8'); // create the file
	await vscode.workspace.applyEdit(wsedit); // finilazing the edit
	vscode.window.showInformationMessage('Your styled.js file has been edited!');
}



// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
