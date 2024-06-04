import Section from '@/models/section.model';
import {TErrorResponse, TParameters} from '@/types/types';

type TSectionInput = {
    userId: string;
    projectId: string;
    structureId: string;
}

type TSectionFilter = {
    userId: string;
    projectId: string;
    structureId: string;
}

export default async function CountSections(sectionInput: TSectionInput, parameters: TParameters = {}): Promise<TErrorResponse | {count: number}> {
    try {
        const {userId, projectId, structureId} = sectionInput;

        if (!userId || !projectId || !structureId) {
            throw new Error('userId & projectId & structureId query required');
        }

        const filter: TSectionFilter = {userId, projectId, structureId};
        const count: number = await Section.countDocuments(filter);

        return {count};
    } catch (error) {
        throw error;
    }
}