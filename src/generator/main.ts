import { fs } from '@irysius/utils';
import * as PATH from 'path';
import {
    parseModuleName,
    parseFileContent,
    IStatements
} from '@irysius/typings-util/helpers';
import { IClientFileResults, generateFiles } from './helpers';
import { IMap } from '../helpers';

interface Result {
    value: IClientFileResults;
    error: Error;
}

function tryGenerateFiles(statement: IStatements): Result {
    let value, error;
    try {
        value = generateFiles(statement);
    } catch (e) {
        error = e;
    }
    return { value, error };
}

function writeFiles(clientFolder: string, results: IClientFileResults[]) {
    return fs.listFiles(clientFolder).then(files => {
        let names: IMap<boolean> = {};
        files.map(f => PATH.basename(f.path)).forEach(name => {
            names[name] = true;
        });

        let primaryWrites = [];
        let typesWrites = [];
        results.forEach(result => {
            // Do not override primary files if one has already been written.
            if (!names[result.primaryFile.fileName]) {
                primaryWrites.push(
                    fs.writeFile(
                        PATH.join(clientFolder, result.primaryFile.fileName), 
                        result.primaryFile.contents));
            }

            // Always override generated types.
            typesWrites.push(
                fs.writeFile(
                    PATH.join(clientFolder, result.typesFile.fileName),
                    result.typesFile.contents));
        });
        return Promise.all([...primaryWrites, ...typesWrites]);
    });
}

export function generateClient(hubTypesFolder: string, clientFolder: string) {
    return fs.listFiles(hubTypesFolder).then(results => {
        let paths = results.map(x => x.path);
        let pContents = paths.map(p => fs.readFile(p));
        return Promise.all(pContents).then(contents => {
            return contents.map(c => c.toString()).map(parseFileContent);
        }).then((statements: IStatements[]) => {
            return statements.map(tryGenerateFiles);
        }).then(results => {
            let errors = results.map(r => r.error).filter(x => !!x);
            let values = results.map(r => r.value).filter(x => !!x);
            return writeFiles(clientFolder, values);
        });
    })
}

