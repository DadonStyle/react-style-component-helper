/* imports */
const vscode = require("vscode");
const fsSync = require("fs");
const fs = require("fs").promises;
const env = vscode.env;
const isWindows = () => !!(env.appRoot && env.appRoot[0] !== "/"); // windows path start usually with c: or f:, linux starts with '/'

/* vars */
// const wsedit = new vscode.WorkspaceEdit();
const styledFileName = "styled.js";
// const os = window.navigator.userAgent;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "react-style-component-helper.generateStyled",
    async function () {
      // this syntax is a template from vscode
      /* validate that the user have any file open while executing the command */
      if (!vscode.window.activeTextEditor) {
        return vscode.window.showInformationMessage(
          "Please enter to the required file and try again"
        );
      }
      // validate that the user is not on the styled js file
      if (vscode.window.activeTextEditor.document.fileName.includes(styledFileName)) {
        vscode.window.showErrorMessage(
          "Please open the file to create from, not styled.js"
        );
        return [];
      }
      /* varbs */ 
      let currentFileName = '';
      let currentFilePath = ''
      let styledPath = '';
      let styledFilePath = '';
      if (isWindows) {
        currentFileName = vscode.window.activeTextEditor.document.fileName
        .split("\\")
        .pop()
        .split(".")[0]
        .trim(); // gets the name to replace
        styledPath = vscode.window.activeTextEditor.document.fileName
        .split("\\")
        .reverse()
        .join("/")
        .replace(currentFileName, "styled")
        .replace("jsx", "js")
        .split("/")
        .reverse()
        .join("/"); // gets the path of the styled file
        styledFilePath = vscode.Uri.file(styledPath); // puts the path inside vscode editor (without we cant create files)
        currentFilePath = vscode.window.activeTextEditor.document.fileName
        .split("\\")
        .join("/"); // gets the path of the current path
      } else {
        currentFileName = vscode.window.activeTextEditor.document.fileName.split('/').pop(); // get current file name to replace
        currentFilePath = vscode.window.activeTextEditor.document.fileName; // get the full user path
        styledPath = currentFilePath.replace(currentFileName, styledFileName); // get the location of the styled path (or where to create it)
      }
      /* filter the file and return the tags and the number of lines*/
      const tagsObject = await findTagsInCurrentFile(currentFilePath, "<S.", ">");
      if (!tagsObject.relevantTags || tagsObject.relevantTags.length <= 0) {
        vscode.window.showErrorMessage(
          "No tags found, Please make sure to use <S. at the start of the tag"
        );
        return;
      }

      /* check if styled.js file already exist */
      const isExist = fsSync.existsSync(styledPath);
      if (isExist) {
        let relevantTags = tagsObject.relevantTags;
        const styledTagsObject = findTagsInCurrentFile(
          styledPath,
          "const",
          "="
        );
        if (styledTagsObject.relevantTags && styledTagsObject.relevantTags.length > 0) {
          relevantTags = handleDuplicate(
            styledTagsObject.relevantTags,
            tagsObject.relevantTags
          );
        }
        await editStyledFile(
          styledPath,
          relevantTags,
          styledTagsObject.numOflines
        );
        return;
      }
      /* create the styled.js file */
      await createStyledFile(styledPath, tagsObject.relevantTags);
      return;
    },
  );
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
async function findTagsInCurrentFile(path, fromSymbol, toSymbol) {
	let relevantTags = [];
	let numOflines = 1; // even if the file is empty the first line will be empty string so its 1
  const content = await readFile(path);
	const arrFile = content.split(/\r?\n/);
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
async function createStyledFile(styledPath, tagsArray) {
// data need to not contain tabs in this file to look good on the target file
	const data =`import styled from \'styled-components/macro\';
${tagsArray.map((item) => `\nconst ${item} = styled.div\`
display: flex;
\`;\n`).join('')}
export default S = {
${tagsArray.map((item) => `${item},\n`).join('')}
};
`;
try {
  await fs.writeFile(styledPath, data, 'utf-8'); // create the file
  vscode.window.showInformationMessage('Your styled.js file has been created!');
} catch (err) {
  vscode.window.showErrorMessage(err.message);
  return;
}	
}

/** 
 * @param path -> path to the file
 */
async function readFile(path) {
  const res = await fs.readFile(path, 'utf-8', (err, data) => {
    if (err) { vscode.window.showErrorMessage(err.message); return; }
    return data;
  });
  return res;
}

/**
 * @param pathStyled -> the path of the *existing* styled.js
 * @param tagsArray -> the array containing the tags for creating the styled components
 * @param numOfLines -> number of lines in the file
 */
async function editStyledFile(pathStyled, tagsArray, numOfLines) {
	const content = await readFile(pathStyled);
	const arrFile = content.split(/\r?\n/);
	if (tagsArray.length < 1) {
		vscode.window.showInformationMessage('No differences has been found');
		return;
	}

	// data need to not contain tabs in this file to look good on the target file
	const data =`${arrFile.map((item) => `${item} \n`).join('')}
${numOfLines > 1 ? '' : 'import styled from \'styled-components/macro\';'}
${tagsArray.map((item) => `\nconst ${item} = styled.div\`
display: flex;
\`;\n`).join('')}
export default S = {
${tagsArray.map((item) => `${item},\n`).join('')}
};

`;	
	await fs.writeFile(pathStyled, data, 'utf-8'); // create the file
	vscode.window.showInformationMessage('Your styled.js file has been edited!');
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}