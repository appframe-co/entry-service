import slugify from 'slugify';

import Section from '@/models/section.model';
import { TErrorResponse, TStructure, TOptions, TSectionInput, TSection, TSectionModel } from '@/types/types';

import { validateString } from '@/utils/validators/string.validator';
import { validateNumber } from '@/utils/validators/number.validator';
import { validateArray } from '@/utils/validators/array.validator';
import { validateDate } from '@/utils/validators/date.validator';
import { validateDateTime } from '@/utils/validators/datetime.validator';
import { checkUnique } from '@/utils/unique';


function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}
function isErrorSection(data: null|TSection): data is null {
    return (data as null) === null;
}

export default async function CreateSection(sectionInput: TSectionInput): Promise<{section: TSection|null, userErrors: any}> {
    try {
        const {projectId, structureId, userId, parentId, ...sectionBody} = sectionInput;

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

        // compare section by structure
        const schemaDataBody = structure.sections.bricks.map(b => ({key: b.key, type: b.type, validations: b.validations}));

        const {errors: errorsForm, data: validatedData} = await (async (data, payload) => {
            try {
                const errors: any = [];
                const output: any = {};

                const {schemaDataBody} = payload;
    
                output.section = await (async function() {
                    const section: any = {};

                    if (data.hasOwnProperty('doc')) {
                        section['doc'] = {};

                        const {doc} = data;
                        if (doc !== undefined && doc !== null) {
                            for (const schemaData of schemaDataBody) {
                                const valueData = doc[schemaData.key];

                                const options: TOptions = schemaData.validations.reduce((acc: any, v) => {
                                    acc[v.code] = [v.value];
                                    return acc;
                                }, {});
        
                                if (schemaData.type === 'single_line_text' || schemaData.type === 'multi_line_text') {
                                    const [errorsValue, valueValue] = validateString(valueData, options);
        
                                    if (Array.isArray(options.unique) ? options.unique[0] : options.unique) {
                                        const isUniquie: boolean|null = await checkUnique(valueValue, {projectId, structureId, subject: 'section', key: 'doc.'+schemaData.key});
                                        if (isUniquie === false) {
                                            errors.push({field: ['doc', schemaData.key], message: 'Value must be unique'}); 
                                        }
                                    }
        
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'number_integer' || schemaData.type === 'number_decimal') {
                                    const [errorsValue, valueValue] = validateNumber(valueData, options);
          
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'boolean') {
                                    const [errorsValue, valueValue] = validateString(valueData, options);
        
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'date_time') {
                                    const [errorsValue, valueValue] = validateDateTime(valueData, options);
        
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'date') {
                                    const [errorsValue, valueValue] = validateDate(valueData, options);
        
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'file_reference') {
                                    const [errorsValue, valueValue] = validateString(valueData, options);
        
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'list.single_line_text') {
                                    const {required, ...restOptions} = options;
                                    const [errorsValue, valueValue] = validateArray(valueData, {
                                        required,
                                        value: ['string', restOptions]
                                    });
        
                                    if (errorsValue.length > 0) {
                                        if (valueValue.length) {
                                            for (let i=0; i < errorsValue.length; i++) {
                                                if (!errorsValue[i]) {
                                                    continue;
                                                }
                                                errors.push({field: ['doc', schemaData.key, i], message: errorsValue[i]}); 
                                            }
                                        } else {
                                            errors.push({field: ['doc', schemaData.key], message: errorsValue[0]});
                                        }
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'list.number_integer' || schemaData.type === 'list.number_decimal') {
                                    const {required, ...restOptions} = options;
                                    const [errorsValue, valueValue] = validateArray(valueData, {
                                        required,
                                        value: ['number', restOptions]
                                    });
        
                                    if (errorsValue.length > 0) {
                                        if (valueValue.length) {
                                            for (let i=0; i < errorsValue.length; i++) {
                                                if (!errorsValue[i]) {
                                                    continue;
                                                }
                                                errors.push({field: ['doc', schemaData.key, i], message: errorsValue[i]}); 
                                            }
                                        } else {
                                            errors.push({field: ['doc', schemaData.key], message: errorsValue[0]});
                                        }
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'list.date_time') {
                                    const {required, ...restOptions} = options;
                                    const [errorsValue, valueValue] = validateArray(valueData, {
                                        required,
                                        value: ['datetime', restOptions]
                                    });
        
                                    if (errorsValue.length > 0) {
                                        if (valueValue.length) {
                                            for (let i=0; i < errorsValue.length; i++) {
                                                if (!errorsValue[i]) {
                                                    continue;
                                                }
                                                errors.push({field: ['doc', schemaData.key, i], message: errorsValue[i]}); 
                                            }
                                        } else {
                                            errors.push({field: ['doc', schemaData.key], message: errorsValue[0]});
                                        }
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'list.date') {
                                    const {required, ...restOptions} = options;
                                    const [errorsValue, valueValue] = validateArray(valueData, {
                                        required,
                                        value: ['date', restOptions]
                                    });
        
                                    if (errorsValue.length > 0) {
                                        if (valueValue.length) {
                                            for (let i=0; i < errorsValue.length; i++) {
                                                if (!errorsValue[i]) {
                                                    continue;
                                                }
                                                errors.push({field: ['doc', schemaData.key, i], message: errorsValue[i]}); 
                                            }
                                        } else {
                                            errors.push({field: ['doc', schemaData.key], message: errorsValue[0]});
                                        }
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'list.file_reference') {
                                    const {required, ...restOptions} = options;
                                    const [errorsValue, valueValue] = validateArray(valueData, {
                                        required,
                                        value: ['string', restOptions]
                                    });
        
                                    if (errorsValue.length > 0) {
                                        if (valueValue.length) {
                                            for (let i=0; i < errorsValue.length; i++) {
                                                if (!errorsValue[i]) {
                                                    continue;
                                                }
                                                errors.push({field: ['doc', schemaData.key, i], message: errorsValue[i]}); 
                                            }
                                        } else {
                                            errors.push({field: ['doc', schemaData.key], message: errorsValue[0]});
                                        }
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'money') {
                                    const {required, ...restOptions} = options;
        
                                    const [errorsValue, valueValue] = validateArray(valueData, {
                                        required,
                                        max: 3
                                    });
                                    if (errorsValue.length) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]});
                                    }
        
                                    if (valueValue) {
                                        valueValue.map((v:any, k:number) => {
                                            const {amount, currencyCode} = v;
            
                                            const [errorsAmount, valueAmount] = validateNumber(amount, {required});
                                            if (errorsAmount.length) {
                                                errors.push({field: ['doc', schemaData.key, k, 'amount'], message: errorsAmount[0]});
                                            }
                                            const [errorsCurrencyCode, valueCurrencyCode] = validateString(currencyCode, {required});
                                            if (errorsCurrencyCode.length) {
                                                errors.push({field: ['doc', schemaData.key, k, 'currencyCode'], message: errorsCurrencyCode[0]});
                                            }
                                        });
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                                if (schemaData.type === 'url_handle') {
                                    const brickRef = schemaData.validations.find(v => v.code === 'brick_reference');
                                    const valueOfBrickRef: string|null = brickRef ? doc[brickRef.value] : null;
        
                                    let handle: string = valueData;
                                    if (!handle && valueOfBrickRef) {
                                        handle = slugify(valueOfBrickRef, {lower: true});
                                    }
        
                                    const [errorsValue, valueValue] = validateString(handle, {required: true, ...options});
        
                                    const isUniquie: boolean|null = await checkUnique(valueValue, {projectId, structureId, subject: 'section', key: 'doc.'+schemaData.key});
                                    if (isUniquie === false) {
                                        errors.push({field: ['doc', schemaData.key], message: 'Value must be unique', value: valueValue}); 
                                    }
        
                                    if (errorsValue.length > 0) {
                                        errors.push({field: ['doc', schemaData.key], message: errorsValue[0]}); 
                                    }
        
                                    if (valueValue !== null && valueValue !== undefined) {
                                        section['doc'][schemaData.key] = valueValue;
                                    }
                                }
                            }
                        }
                    }

                    return section;
                }());

                return {errors, data: output};
            } catch (e) {
                let message = 'Error';
                if (e instanceof Error) {
                    message = e.message;
                }

                return {errors: [{message}]};
            }
        })(sectionBody, {schemaDataBody});
        if (Object.keys(errorsForm).length > 0) {
            return {
                section: null,
                userErrors: errorsForm
            };
        }

        const {errors: errorsDB, data: savedData} = await (async (data) => {
            try {
                const errors: any = [];
                const output: any = {};

                const parentSection: TSectionModel|null = await Section.findOne({_id: parentId, projectId, structureId, userId});
                const pId = parentSection && parentSection.id;

                const section: TSectionModel|null = await Section.create({
                    ...data.section, parentId: pId, 
                    projectId, structureId, userId, 
                    createdBy: userId, updatedBy: userId
                });
                if (isErrorSection(section)) {
                    throw new Error('Failed to add section');
                }

                const {id: sectionId} = section;
                output.sectionId = sectionId;

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
                section: null,
                userErrors: errorsDB
            }
        }

        const {errors: errorsRes, data: obtainedData} = await (async (data): Promise<{errors: any, data: {section: TSection|null}}> => {
            try {
                const errors: any = [];
                let output: {section: TSection|null} = {section: null};

                const {sectionId} = data;

                const section: TSectionModel|null = await Section.findOne({_id: sectionId, projectId, structureId, userId});
                if (isErrorSection(section)) {
                    output.section = null;
                } else {
                    output.section = {
                        id: section.id,
                        projectId: section.projectId,
                        structureId: section.structureId,
                        parentId: section.parentId,
                        createdAt: section.createdAt,
                        updatedAt: section.updatedAt,
                        createdBy: section.createdBy,
                        updatedBy: section.updatedBy,
                        doc: section.doc
                    }
                }

                return {errors, data: output};
            } catch (e) {
                let message;
                if (e instanceof Error) {
                    message = e.message;
                }
                return {errors: [{message}], data: {section: null}};
            }
        })(savedData);
        if (Object.keys(errorsRes).length > 0) {
            return {
                section: null,
                userErrors: errorsRes
            }
        }

        return {
            section: obtainedData.section,
            userErrors: []
        };
    } catch (e) {
        let message;
        if (e instanceof Error) {
            message = e.message;
        }
        return {
            section: null,
            userErrors: [{message}]
        };
    }
}