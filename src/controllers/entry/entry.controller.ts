import Entry from '@/models/entry.model';
import {TEntry, TEntryInput, TErrorResponse, TStructure, TDoc, TFile, TEntryModel} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function EntryController(entryInput: TEntryInput): Promise<TErrorResponse | {entry: TEntry, files: TFile[]}> {
    try {
        const {id, projectId, createdBy, structureId} = entryInput;

        const entry: TEntryModel|null = await Entry.findOne({createdBy, projectId, _id: id});
        if (!entry) {
            throw new Error('invalid entry');
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

        // compare entry by structure
        const codes = structure.bricks.map(b => b.code);
        const doc: TDoc = {};
        if (entry.doc) {
            codes.forEach(code => {
                doc[code] = entry.doc.hasOwnProperty(code) ? entry.doc[code] : null;
            });
        }

        let fileIds: string[] = [];
        const types = ['image'];
        const codeListFile = structure.bricks.filter(b => types.includes(b.type)).map(b => b.code);
        for (const code of codeListFile) {
            if (!doc[code]) {
                continue;
            }
            fileIds = [...fileIds, ...doc[code]];
        }

        const resFetchFiles = await fetch(
            `${process.env.URL_FILE_SERVICE}/api/get_files_by_ids?projectId=${projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fileIds})
        });
        const {files}: {files: TFile[]} = await resFetchFiles.json();


        const output = {
            id: entry.id,
            projectId: entry.projectId,
            structureId: entry.structureId,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            createdBy: entry.createdBy,
            updatedBy: entry.updatedBy,
            doc
        };
        return {entry: output, files};
    } catch (error) {
        throw error;
    }
}