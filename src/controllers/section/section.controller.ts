import Section from '@/models/section.model';
import {TErrorResponse, TStructure, TDoc, TFile, TSection, TSectionModel} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

type TSectionInput = {
    userId: string;
    projectId: string; 
    structureId: string; 
    id: string;
}

export default async function SectionController(sectionInput: TSectionInput): Promise<TErrorResponse | {section: TSection, files: TFile[]}> {
    try {
        const {id, projectId, userId, structureId} = sectionInput;

        const section: TSectionModel|null = await Section.findOne({createdBy: userId, projectId, _id: id});
        if (!section) {
            throw new Error('invalid section');
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

        // compare section by structure
        const keys = structure.sections.bricks.map(b => b.key);
        const doc: TDoc = {};
        if (section.doc) {
            keys.forEach(key => {
                doc[key] = section.doc.hasOwnProperty(key) ? section.doc[key] : null;
            });
        }

        let fileIds: string[] = [];
        const types = ['file_reference', 'list.file_reference'];
        const keyListFile = structure.sections.bricks.filter(b => types.includes(b.type)).map(b => b.key);
        for (const key of keyListFile) {
            if (!doc[key]) {
                continue;
            }

            if (Array.isArray(doc[key])) {
                fileIds = [...fileIds, ...doc[key]];
            } else {
                fileIds = [...fileIds, doc[key]];
            }
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
            id: section.id,
            projectId: section.projectId,
            structureId: section.structureId,
            parentId: section.parentId,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
            createdBy: section.createdBy,
            updatedBy: section.updatedBy,
            doc
        };
        return {section: output, files};
    } catch (error) {
        throw error;
    }
}