import Entry from '@/models/entry.model';
import {TEntry, TEntryInput, TDoc, TErrorResponse, TFile, TStructure, TEntryModel, TParameters} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function Entries(entryInput: TEntryInput, parameters: TParameters = {}): Promise<TErrorResponse | {entries: TEntry[], names: string[], keys: string[]}>{
    try {
        const {projectId, structureId, userId} = entryInput;

        if (!userId || !projectId || !structureId) {
            throw new Error('userId & projectId & structureId query required');
        }

        const defaultLimit = 10;

        const filter: any = {createdBy: userId, projectId, structureId};
        let {sinceId, limit=defaultLimit, skip=0} = parameters;

        if (limit > 250) {
            limit = defaultLimit;
        }
        if (sinceId) {
            filter['_id'] = {$gt: sinceId};
        }

        const entries: TEntryModel[] = await Entry.find(filter).skip(skip).limit(limit);
        if (!entries) {
            throw new Error('invalid entries');
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

        // COMPARE entries by structure
        const names = structure.bricks.map(b => b.name);
        const keys = structure.bricks.map(b => b.key);
        const result = entries.map(entry => {
            const doc = keys.reduce((acc: TDoc, key: string) => {
                acc[key] = entry.doc.hasOwnProperty(key) ? entry.doc[key] : null

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
        const types = ['file_reference', 'list.file_reference'];
        const keyListFile = structure.bricks.filter(b => types.includes(b.type)).map(b => b.key);

        for (const r of result) {
            for (const key of keyListFile) {
                if (!r.doc[key]) {
                    continue;
                }
                
                if (Array.isArray(r.doc[key])) {
                    fileIds = [...fileIds, ...r.doc[key]];
                } else {
                    fileIds = [...fileIds, r.doc[key]];
                }
            }
        }

        // MERGE files with entry
        const resFetchFiles = await fetch(
            `${process.env.URL_FILE_SERVICE}/api/get_files_by_ids?projectId=${projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fileIds})
        });
        const {files}: {files: TFile[]} = await resFetchFiles.json();

        for (const r of result) {
            for (const key of keyListFile) {
                if (!r.doc[key]) {
                    continue;
                }

                if (Array.isArray(r.doc[key])) {
                    r.doc[key] = files.filter(file => r.doc[key].includes(file.id));
                } else {
                    r.doc[key] = files.find(file => r.doc[key].includes(file.id));
                }
                
            }
        }

        return {entries: result, names, keys};
    } catch (error) {
        throw error;
    }
}