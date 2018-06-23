import { constructPrimaryFile, constructTypesFile } from "./template";

export interface IStatements {
    imports: string[];
    exports: string[][];
    internal: {
        interfaces: string[][];
        types: string[];
    };
}

export interface IClientFileResults {
    primaryFile: {
        fileName: string;
        contents: string;
    },
    typesFile: {
        fileName: string;
        contents: string;
    }
};

export function generateFiles(statements: IStatements): IClientFileResults {
    let hubName = assertDefaultExport(statements);
    let { receiveType, sendType } = assertHubDeclaration(statements, hubName);

    let receiveInterface = assertInterface(statements, receiveType);
    let sendInterface = assertInterface(statements, sendType);

    let temp = swapInterfaceNames(receiveInterface, sendInterface);
    let _clientName = createClientName(hubName);

    let params = {
        clientName: _clientName,
        receiveType, sendType,
        sendInterface: temp.sendInterface,
        receiveInterface: temp.receiveInterface
    };
    let primaryFile = constructPrimaryFile(params);
    let typesFile = constructTypesFile(params);

    return {
        primaryFile, typesFile
    };
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
