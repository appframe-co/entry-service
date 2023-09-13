import Entry from '@/models/entry.model';
import { TEntry, TEntryInput, TDoc, TErrorResponse, TStructure, TEntryModel } from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function UpdateEntry(entryInput: TEntryInput): Promise<TErrorResponse | {entry: TEntry}> {
    try {
        const {id, projectId, structureId, createdBy, updatedBy, doc: docInput} = entryInput;

        if (!id) {
            throw new Error('id required');
        }

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
        const keys = structure.bricks.map(b => b.key);
        const doc: TDoc = {};
        if (docInput) {
            keys.forEach(key => {
                doc[key] = docInput.hasOwnProperty(key) ? docInput[key] : null;
            });
        }

        const updatedEntry: TEntryModel|null  = await Entry.findOneAndUpdate({
            createdBy, 
            projectId,
            _id: id
        }, {updatedBy, doc});
        if (!updatedEntry) {
            throw new Error('invalid entry');
        }

        return {entry: updatedEntry};
    } catch (error) {
        throw error;
    }
}