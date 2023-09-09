import Entry from '@/models/entry.model';
import {TEntry, TEntryInput, TDoc, TErrorResponse, TFile, TStructure, TEntryModel} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function Entries(entryInput: TEntryInput): Promise<TErrorResponse | {entries: TEntry[], names: string[], codes: string[]}>{
    try {
        const {projectId, structureId, createdBy} = entryInput;

        if (!createdBy || !projectId || !structureId) {
            throw new Error('createdBy & projectId & structureId query required');
        }

        const filter = {createdBy, projectId, structureId};

        const entries: TEntryModel[] = await Entry.find(filter);
        if (!entries) {
            throw new Error('invalid entries');
        }

        // GET structure
        const resFetchStructure = await fetch(`${process.env.URL_STRUCTURE_SERVICE}/api/structures/${structureId}?userId=${createdBy}&projectId=${projectId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const structureFetch: {structure: TStructure}|TErrorResponse = await resFetchStructure.json();
        if (isErrorStructure(structureFetch)) {
            throw new Error('Error structure');
        }

        const {structure} = structureFetch;

        // COMPARE entries by structure
        const names = structure.bricks.map(b => b.name);
        const codes = structure.bricks.map(b => b.code);
        const result = entries.map(entry => {
            const doc = codes.reduce((acc: TDoc, code: string) => {
                acc[code] = entry.doc.hasOwnProperty(code) ? entry.doc[code] : null

                return acc;
            }, {});

            return {
                id: entry.id,
                projectId: entry.projectId,
                structureId: entry.structureId,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                createdBy: entry.createdBy,
                updatedBy: entry.updatedBy,
                doc
            };
        });

        let fileIds: string[] = [];
        const types = ['image'];
        const codeListFile = structure.bricks.filter(b => types.includes(b.type)).map(b => b.code);
        for (const r of result) {
            for (const code of codeListFile) {
                if (!r.doc[code]) {
                    continue;
                }
                
                fileIds = [...fileIds, ...r.doc[code]];
            }
        }
       
        // MERGE files with entry
        const resFetchFiles = await fetch(
            `${process.env.URL_FILE_SERVICE}/api/get_file?projectId=${projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fileIds})
        });
        const {files}: {files: TFile[]} = await resFetchFiles.json();

        for (const r of result) {
            for (const code of codeListFile) {
                if (!r.doc[code]) {
                    continue;
                }
                r.doc[code] = files.filter(file => r.doc[code].includes(file.id));
            }
        }

        return {entries: result, names, codes};
    } catch (error) {
        throw error;
    }
}