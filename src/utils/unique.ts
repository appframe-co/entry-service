import { TEntryModel } from "@/types/types";
import Entry from '@/models/entry.model';

type TPayload = {
    entryId?: string;
    projectId: string;
    structureId: string;
    key: string;
}

export async function checkUnique(value: string|null, payload: TPayload): Promise<boolean|null> {
    try {
        const {entryId, projectId, structureId, key} = payload;

        if (!projectId || !structureId || !key) {
            throw new Error('projectId & structureId & key is required');
        }

        const filter: {[key:string]: any} = {projectId, structureId, [`doc.${key}`]: value};
        if (entryId) {
            filter['_id'] = {$ne: entryId};
        }
        const entry: TEntryModel|null = await Entry.findOne(filter);
        if (entry) {
            return false;
        }

        return true;
    } catch (e) {
        return null;
    }
}