import Entry from '@/models/entry.model';
import { TEntry, TEntryInput, TDoc, TErrorResponse, TStructure, TEntryModel } from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function CreateEntry(entryInput: TEntryInput): Promise<TErrorResponse | {entry: TEntry}> {
    try {
        const {projectId, structureId, createdBy, updatedBy, doc: docInput} = entryInput;

        if (!projectId || !structureId) {
            throw new Error('projectId & structureId required');
        }
        if (!createdBy || !updatedBy) {
            throw new Error('createdBy & updatedBy required');
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
        if (docInput) {
            codes.forEach(code => {
                doc[code] = docInput.hasOwnProperty(code) ? docInput[code] : null;
            });
        }

        const newEntry: TEntryModel = await Entry.create({...entryInput, doc});
        if (!newEntry) {
            throw new Error('invalid entry');
        }

        return {entry: newEntry};
    } catch (error) {
        throw error;
    }
}