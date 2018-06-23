const NEWLINE = '\r\n';

interface Field {
    name: string;
    type: string;
}

export interface IConstructParams {
    clientName: string;
    receiveType: string;
    sendType: string;
    receiveInterface: string[];
    sendInterface: string[];
}

export function constructTypesFile(params: IConstructParams) {
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
export function constructPrimaryFile(params: IConstructParams) {
    let {
        clientName, receiveType, sendType, receiveInterface, sendInterface
    } = params;

    let receives = constructReceive(receiveInterface);

    let contents = [
        `import { ClientTemplate, Client, augmentClient } from '@irysius/anguli-components/Client';`,
        `import { ${receiveType}, ${sendType} } from './${clientName}Types';`,
        `let _${clientName}: ClientTemplate<${receiveType}, ${sendType}> = {`,
        `    connect: function () { },`,
        `    reconnect: function (attemptNumber: number) { },`,
        `    disconnect: function (reason: string) { },`,
        `    receive: {`,
        ...receives,
        `    },`,
        `};`,
        `export let ${clientName}: Client<${receiveType}, ${sendType}> = augmentClient(_${clientName});`
    ];
    return {
        fileName: `${clientName}.ts`,
        contents: contents.join(NEWLINE)
    };
}

function doubleTab(line: string) {
    return `        ${line}`;
}
function matchInterfaceField(line: string): Field {
    let match = /(\w+): (\w+);/g.exec(line);
    if (!match) { return null; }
    return {
        name: match[1],
        type: match[2]
    };
}
function parseFieldsFromInterface(_interface: string[]): Field[] {
    return _interface.map(matchInterfaceField).filter(x => !!x);
}
function constructReceive(receiveInterface: string[]) {
    let fields = parseFieldsFromInterface(receiveInterface);
    return fields.map(field => {
        return `${field.name}: function (payload: ${field.type}) { },`
    }).map(doubleTab);
}