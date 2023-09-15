import Entry from '@/models/entry.model';
import {TEntry, TEntryInput, TErrorResponse, TStructure, TDoc, TFile, TEntryModel} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function EntryController(entryInput: TEntryInput): Promise<TErrorResponse | {entry: TEntry, files: TFile[]}> {
    try {
        const {id, projectId, userId, structureId} = entryInput;

        const entry: TEntryModel|null = await Entry.findOne({createdBy: userId, projectId, _id: id});
        if (!entry) {
            throw new Error('invalid entry');
        }

        // GET structure
        const resFetchStructure = await fetch(`${process.env.URL_STRUCTURE_SERVICE}/api/structures/${structureId}?userId=${userId}&projectId=${projectId}`, {
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
        const keys = structure.bricks.map(b => b.key);
        const doc: TDoc = {};
        if (entry.doc) {
            keys.forEach(key => {
                doc[key] = entry.doc.hasOwnProperty(key) ? entry.doc[key] : null;
            });
        }

        let fileIds: string[] = [];
        const types = ['file'];
        const keyListFile = structure.bricks.filter(b => types.includes(b.type)).map(b => b.key);
        for (const key of keyListFile) {
            if (!doc[key]) {
                continue;
            }
            fileIds = [...fileIds, ...doc[key]];
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