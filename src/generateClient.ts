import { fs } from '@irysius/utils';
import * as PATH from 'path';
import {
    parseModuleName,
    parseFileContent
} from '@irysius/typings-util/helpers';

const NEWLINE = '\r\n';

interface IStatements {
    imports: string[];
    exports: string[][];
    internal: Internal;
}
interface Internal {
    interfaces: string[][];
    types: string[];
}

export function generateClient(hubTypesFolder: string) {
    fs.listFiles(hubTypesFolder).then(results => {
        let paths = results.map(x => x.path);
        let moduleNames = paths
            .map(p => parseModuleName(p, hubTypesFolder))
            .map(p => p.split(PATH.sep).join('/')); // Need to enforce / as separator.
    
        let pContents = paths.map(p => fs.readFile(p));
        return Promise.all(pContents).then(contents => {
            return contents.map(c => c.toString()).map(parseFileContent);
        }).then((statements: IStatements[]) => {
            statements.forEach(statement => {
                let hubName = assertDefaultExport(statement);
                let { receiveType, sendType } = assertHubDeclaration(statement, hubName);

                let receiveInterface = assertInterface(statement, receiveType);
                let sendInterface = assertInterface(statement, sendType);

                let temp = swapInterfaceNames(receiveInterface, sendInterface);
                let _clientName = createClientName(hubName);

                let params = {
                    clientName: _clientName,
                    receiveType, sendType,
                    sendInterface: temp.sendInterface,
                    receiveInterface: temp.receiveInterface
                };
                let mainFile = constructPrimaryFile(params);
                let typesFile = constructTypesFile(params);
                console.log(typesFile.contents);
                console.log('--------------------');
                console.log(mainFile.contents);
            });
        });
    })
}

function firstLine(lines: string[]): string {
    return lines[0]
}
/**
 * Returns the first item located in a collection given a specific mapper.
 * If no match can be found, returns null.
 */
function match<T, L>(lines: L[], mapper: (line: L) => T): T {
    let i: number;
    for (i = 0; i < lines.length; ++i) {
        let line = lines[i];
        let item = mapper(line);
        if (item != null) { return item; }
    }
    return null;
}

function matchDefaultExport(line: string) {
    if (line.startsWith('export default ')) {
        let hubName = line.replace('export default ', '').replace(';', '');
        return hubName;
    } else {
        return null;
    }
}
function matchHubDeclaration(hubName: string) {
    let match = `export declare let ${hubName}: HubTemplate<`;
    return function (line: string) {
        if (line.startsWith(match)) {
            let types = line.replace(match, '').replace('>;', '');
            let [receiveType, sendType] = types.split(',').map(x => x.trim());
            return {
                receiveType, sendType
            };
        } else {
            return null;
        }
    }
}
function matchFirstLine(match: string) {
    return function (lines: string[]) {
        let firstLine = lines[0];
        return firstLine.startsWith(match) ? lines : null;
    }
}

function assertDefaultExport(statements: IStatements): string {
    let firstLines = statements.exports.map(firstLine);
    let hubName = match(firstLines, matchDefaultExport);
    if (hubName == null) {
        throw new Error('Client generation from Hub requires a default export');
    }
    if (!hubName.endsWith('Hub')) {
        throw new Error('Client generation from Hub requires the default export variable to have a name that ends in "Hub"');
    }
    return hubName;
}
function assertHubDeclaration(statements: IStatements, hubName: string) {
    // TODO: Evaluate if the strict import string match is appropriate.
    if (!statements.imports.some(l => 
        l === 'import { HubTemplate } from "@irysius/anguli-components/Hub";' || 
        l === "import { HubTemplate } from '@irysius/anguli-components/Hub';")) 
    {
        throw new Error('Client generation from Hub expects a hub template that is explicitly of type HubTemplate');
    }
    let firstLines = statements.exports.map(firstLine);
    let result = match(firstLines, matchHubDeclaration(hubName));
    if (!result) {
        throw new Error('Client generation from Hub expects a hub template that is explicitly of type HubTemplate');
    }
    let { receiveType, sendType } = result;
    if (receiveType == null || sendType == null) {
        throw new Error('Client generation from Hub expects a hub template that explicitly types the "R" and "S" generic type parameters in the type HubTemplate');
    }
    return result;
}
function assertInterface(statements: IStatements, interfaceName: string) {
    // Look at both internal and exported interfaces
    let internalMatch = `interface ${interfaceName} {`;
    let exportMatch = `export interface ${interfaceName} {`;
    let result = match(statements.exports, matchFirstLine(exportMatch));
    if (result) {
        return result;
    }
    result = match(statements.internal.interfaces, matchFirstLine(internalMatch));
    if (!result) {
        throw new Error(`Client generation from Hub could not locate the interface ${interfaceName}`);
    }
    return result;
}

/**
 * Given a Hub IRecieve and a Hub ISend, generate a Client IReceive and a Client ISend
 */
function swapInterfaceNames(receiveInterface: string[], sendInterface: string[]) {
    let oSend = sendInterface[0].startsWith('export ')
        ? sendInterface[0] : `export ${sendInterface[0]}`;
    let oReceive = receiveInterface[0].startsWith('export ')
        ? receiveInterface[0] : `export ${receiveInterface[0]}`;
    sendInterface[0] = oReceive;
    receiveInterface[0] = oSend;
    return {
        sendInterface: receiveInterface,
        receiveInterface: sendInterface
    };
}
function createClientName(hubName: string) {
    return hubName.replace('Hub', 'Client');
}
interface IConstructParams {
    clientName: string;
    receiveType: string;
    sendType: string;
    receiveInterface: string[];
    sendInterface: string[];
}

function constructTypesFile(params: IConstructParams) {
    let {
        clientName, receiveType, sendType, receiveInterface, sendInterface
    } = params;
    let comments = [
        '// =================================================',
        '// This is an autogenerated file.',
        '// Please refrain from manually modifying this file.',
        '// ================================================='
    ];

    let contents = [
        ...comments,
        '',
        ...sendInterface,
        ...receiveInterface
    ];
    return {
        fileName: `${clientName}Types.ts`,
        contents: contents.join(NEWLINE)
    };
}
function constructPrimaryFile(params: IConstructParams) {
    let {
        clientName, receiveType, sendType, receiveInterface, sendInterface
    } = params;

    let contents = [
        `import { ClientTemplate, Client, augmentClient } from '@irysius/anguli-components/Client';`,
        `import { ${receiveType}, ${sendType} } from './${clientName}Types';`,
        `let _${clientName}: ClientTemplate<${receiveType}, ${sendType}> = {`,

        `}`,
        `export let ${clientName}: Client<${receiveType}, ${sendType}> = augmentClient(_${clientName});`
    ];
    return {
        fileName: `${clientName}.ts`,
        contents: contents.join(NEWLINE)
    };
}