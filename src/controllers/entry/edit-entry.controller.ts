import Entry from '@/models/entry.model';
import { TEntry, TEntryInput, TDoc, TErrorResponse, TStructure, TEntryModel } from '@/types/types';

import { stringValidator } from '@/utils/validators/string.validator';
import { numberValidator } from '@/utils/validators/number.validator';
import { arrayValidator } from '@/utils/validators/array.validator';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}
function isErrorEntry(data: null|TEntry): data is null {
    return (data as null) === null;
}

export default async function UpdateEntry(entryInput: TEntryInput): Promise<{entry: TEntry|null, userErrors: any}> {
    try {
        const {id, projectId, structureId, userId, doc: docBody} = entryInput;

        if (!id) {
            throw new Error('id required');
        }

        if (!projectId || !structureId || !userId) {
            throw new Error('projectId & structureId & userId required');
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
        const schemaDataBody = structure.bricks.map(b => ({key: b.key, type: b.type, validations: b.validations}));

        const {errors: errorsForm, data: validatedData} = await (async (data, payload) => {
            try {
                const errors: any = [];
                const output: any = {};

                const {schemaDataBody} = payload;

                data = data ?? [];

                output.entry = await (async function() {
                    const entry: any = {};

                    for (const schemaData of schemaDataBody) {
                        const valueData = data[schemaData.key];

                        const [errorsValue, valueValue] = (function(){
                            const options = schemaData.validations.reduce((acc: any, v) => {
                                acc[v.code] = v.value;
                                return acc;
                            }, {});

                            if (schemaData.type === 'single_line_text' || schemaData.type === 'multi_line_text') {
                                return stringValidator(valueData, options);
                            }
                            if (schemaData.type === 'number_integer' || schemaData.type === 'number_decimal') {
                                return numberValidator(valueData, options);
                            }
                            if (schemaData.type === 'file') {
                                return arrayValidator(valueData, options);
                            }
                            if (schemaData.type === 'list.single_line_text') {
                                const [errorsField, valueField] = arrayValidator(JSON.parse(valueData), {
                                    value: ['string', options]
                                });
                                return [errorsField, JSON.stringify(valueField)];
                            }
                            if (schemaData.type === 'list.number_integer' || schemaData.type === 'list.number_decimal') {
                                const [errorsField, valueField] = arrayValidator(JSON.parse(valueData), {
                                    value: ['number', options]
                                });
                                return [errorsField, JSON.stringify(valueField)];
                            }

                            return [[], valueData];
                        }());
                        if (errorsValue.length > 0) {
                            if (schemaData.type.split('.')[0] === 'list' && errorsValue.length > 1) {
                                for (let i=0; i < errorsValue.length; i++) {
                                    if (!errorsValue[i]) {
                                        continue;
                                    }
                                    errors.push({field: [schemaData.key, i], message: errorsValue[i]}); 
                                }
                            } else {
                                errors.push({field: [schemaData.key], message: errorsValue[0]}); 
                            }
                        }
                        entry[schemaData.key] = valueValue;
                    }

                    return entry;
                }());

                return {errors, data: output};
            } catch (e) {
                let message = 'Error';
                if (e instanceof Error) {
                    message = e.message;
                }

                return {errors: [{message}]};
            }
        })(docBody, {schemaDataBody});
        if (Object.keys(errorsForm).length > 0) {
            return {
                entry: null,
                userErrors: errorsForm
            };
        }

        const {errors: errorsDB, data: savedData} = await (async (data) => {
            try {
                const errors: any = [];
                const output: any = {};

                const entry: TEntryModel|null = await Entry.findOneAndUpdate({userId, projectId, _id: id}, {doc: data.entry, updatedBy: userId});
                if (isErrorEntry(entry)) {
                    throw new Error('Failed to update entry');
                }

                const {id: entryId} = entry;
                output.entryId = entryId;

                if (errors.length > 0) {
                    return {errors};
                }

                return {errors, data: output};
            } catch (e) {
                let message;
                if (e instanceof Error) {
                    message = e.message;
                }
                return {errors: [{message}]};
            }
        })(validatedData);
        if (Object.keys(errorsDB).length > 0) {
            return {
                entry: null,
                userErrors: errorsDB
            }
        }

        const {errors: errorsRes, data: obtainedData} = await (async (data): Promise<{errors: any, data: {entry: TEntry|null}}> => {
            try {
                const errors: any = [];
                let output: {entry: TEntry|null} = {entry: null};

                const {entryId} = data;

                const entry: TEntryModel|null = await Entry.findOne({_id: entryId, projectId, structureId, userId});
                if (isErrorEntry(entry)) {
                    output.entry = null;
                } else {
                    output.entry = {
                        id: entry.id,
                        projectId: entry.projectId,
                        structureId: entry.structureId,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                        createdBy: entry.createdBy,
                        updatedBy: entry.updatedBy,
                        doc: entry.doc
                    }
                }

                return {errors, data: output};
            } catch (e) {
                let message;
                if (e instanceof Error) {
                    message = e.message;
                }
                return {errors: [{message}], data: {entry: null}};
            }
        })(savedData);
        if (Object.keys(errorsRes).length > 0) {
            return {
                entry: null,
                userErrors: errorsRes
            }
        }

        return {
            entry: obtainedData.entry,
            userErrors: []
        };
    } catch (e) {
        let message;
        if (e instanceof Error) {
            message = e.message;
        }
        return {
            entry: null,
            userErrors: [{message}]
        };
    }
}