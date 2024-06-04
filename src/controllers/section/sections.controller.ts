import Section from '@/models/section.model';
import {TDoc, TErrorResponse, TFile, TStructure, TParameters, TSection, TSectionModel} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

type TSectionInput = {
    userId: string;
    projectId: string; 
    structureId: string;
}

type TProps = {
    sections: TSection[];
    names: string[];
    keys: string[];
    parent: TSection|null;
}

export default async function Sections(sectionInput: TSectionInput, parameters: TParameters = {}): Promise<TErrorResponse | TProps>{
    try {
        const {userId, projectId, structureId} = sectionInput;

        if (!userId || !projectId || !structureId) {
            throw new Error('userId & projectId & structureId query required');
        }

        const defaultLimit = 10;

        const filter: any = {createdBy: userId, projectId, structureId};
        let {sinceId, limit=defaultLimit, page=1, ids, parent_id=null} = parameters;

        if (limit > 250) {
            limit = defaultLimit;
        }
        if (sinceId) {
            filter['_id'] = {$gt: sinceId};
        }
        if (ids) {
            filter['_id'] = {$in: ids.split(',')};
        }
        filter['parentId'] = parent_id;

        const skip = (page - 1) * limit;

        const sections: TSectionModel[] = await Section.find(filter).skip(skip).limit(limit);
        if (!sections) {
            throw new Error('invalid sections');
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

        // COMPARE sections by structure
        const names = structure.sections.bricks.map(b => b.name);
        const keys = structure.sections.bricks.map(b => b.key);
        const result = sections.map(section => {
            const doc = keys.reduce((acc: TDoc, key: string) => {
                acc[key] = section.doc.hasOwnProperty(key) ? section.doc[key] : null

                return acc;
            }, {});

            return {
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

        // MERGE files with section
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

        const parent: TSection|null = await (async function() {
            try {
                const section: TSectionModel|null = await Section.findOne({createdBy: userId, projectId, structureId, _id: parent_id});
                if (!section) {
                    return null;
                }
    
                const doc = keys.reduce((acc: TDoc, key: string) => {
                    acc[key] = section.doc.hasOwnProperty(key) ? section.doc[key] : null
        
                    return acc;
                }, {});
        
                return {
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
            } catch(e) {
                return null;
            }
        })();

        return {sections: result, names, keys, parent};
    } catch (error) {
        throw error;
    }
}