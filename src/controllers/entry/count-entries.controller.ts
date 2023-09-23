import Entry from '@/models/entry.model';
import {TErrorResponse, TParameters} from '@/types/types';

type TEntryInput = {
    userId: string;
    projectId: string;
    structureId: string;
}

type TEntryFilter = {
    userId: string;
    projectId: string;
    structureId: string;
}

export default async function CountEntries(entryInput: TEntryInput, parameters: TParameters = {}): Promise<TErrorResponse | {count: number}> {
    try {
        const {userId, projectId, structureId} = entryInput;

        if (!userId || !projectId || !structureId) {
            throw new Error('userId & projectId & structureId query required');
        }

        const filter: TEntryFilter = {userId, projectId, structureId};
        const count: number = await Entry.countDocuments(filter);

        return {count};
    } catch (error) {
        throw error;
    }
}