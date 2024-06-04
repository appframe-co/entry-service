import { TEntryModel, TSectionModel } from "@/types/types";
import Entry from '@/models/entry.model';
import Section from '@/models/section.model';

type TPayload = {
    entryId?: string;
    sectionId?: string|null;
    projectId: string;
    structureId: string;
    key: string;
    subject: string
}

export async function checkUnique(value: string|null, payload: TPayload): Promise<boolean|null> {
    try {
        const {entryId, sectionId, projectId, structureId, key, subject} = payload;

        if (!projectId || !structureId || !key) {
            throw new Error('projectId & structureId & key is required');
        }

        if (subject === 'section') {
            const filter: {[key:string]: any} = {projectId, structureId, [key]: value};
            if (sectionId) {
                filter['_id'] = {$ne: sectionId};
            }
            const section: TSectionModel|null = await Section.findOne(filter);
            if (section) {
                return false;
            }
        }

        if (subject === 'entry') {
            const filter: {[key:string]: any} = {projectId, structureId, [key]: value};
            if (sectionId) {
                filter['_id'] = {$ne: sectionId};
            }
            const entry: TEntryModel|null = await Entry.findOne(filter);
            if (entry) {
                return false;
            }
        }

        return true;
    } catch (e) {
        return null;
    }
}