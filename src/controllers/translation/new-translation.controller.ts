import Translation from '@/models/translation.model';
import { TTranslation, TErrorResponse, TStructure, TTranslationModel, TValueTranslation } from '@/types/types';
import { validateArray } from '@/utils/validators/array.validator';

import { validateString } from '@/utils/validators/string.validator';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}
function isErrorTranslation(data: null|TTranslation): data is null {
    return (data as null) === null;
}

type TTranslationInput = {
    userId: string; 
    projectId: string;
    structureId: string;
    subjectId: string;
    subject: string;
    key: string;
    value: TValueTranslation;
    lang: string;
}

export default async function CreateTranslation(translationInput: TTranslationInput): Promise<{translation: TTranslation|null, userErrors: any}> {
    try {
        const {userId, projectId, structureId, subjectId, ...translationBody} = translationInput;

        if (!userId || !projectId || !structureId || !subjectId) {
            throw new Error('projectId & structureId & userId & subjectId required');
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

        // compare translation by structure
        const schemaDataBody = structure.bricks.map(b => ({key: b.key, type: b.type, validations: b.validations}));

        const {errors: errorsForm, data: validatedData} = await (async (data, payload) => {
            try {
                const errors: any = [];
                const output: any = {};

                output.translation = await (async function() {
                    const translation: any = {};

                    const {subject} = data;
                    const [errorsSubject, valueSubject] = validateString(subject, {
                        required: true,
                        enumList: ['entry', 'file']
                    });
                    if (errorsSubject.length > 0) {
                        errors.push({field: ['subject'], message: errorsSubject[0]});
                    }
                    translation.subject = valueSubject;

                    const {key} = data;
                    const [errorsKey, valueKey] = validateString(key, {
                        required: true
                    });
                    if (errorsKey.length > 0) {
                        errors.push({field: ['key'], message: errorsKey[0]});
                    }
                    translation.key = valueKey;

                    const {lang} = data;
                    const [errorsLang, valueLang] = validateString(lang, {
                        required: true
                    });
                    if (errorsLang.length > 0) {
                        errors.push({field: ['lang'], message: errorsLang[0]}); 
                    }
                    translation.lang = valueLang;

                    const {value={}} = data;
                    const valueAfterValidate:TValueTranslation = {};
                    for (const k of Object.keys(value)) {
                        if (!Array.isArray(value[k])) {
                            const [errorsValue, valueValue] = validateString(value[k]);
                            if (errorsValue.length > 0) {
                                errors.push({field: [k], message: errorsValue[0]}); 
                            }
                            valueAfterValidate[k] = valueValue;
                        } else {
                            const [errorsValue, valueValue] = validateArray(value[k], {
                                value: ['string', {}]
                            });
                            if (errorsValue.length > 0) {
                                if (valueValue.length) {
                                    for (let i=0; i < errorsValue.length; i++) {
                                        if (!errorsValue[i]) {
                                            continue;
                                        }
                                        errors.push({field: [k, i], message: errorsValue[i]}); 
                                    }
                                } else {
                                    errors.push({field: [k], message: errorsValue[0]});
                                }
                            }
                            if (valueValue !== null && valueValue !== undefined) {
                                valueAfterValidate[k] = valueValue;
                            }
                        }
                    }
                    translation.value = valueAfterValidate;

                    return translation;
                }());

                return {errors, data: output};
            } catch (e) {
                let message = 'Error';
                if (e instanceof Error) {
                    message = e.message;
                }

                return {errors: [{message}]};
            }
        })(translationBody, {schemaDataBody});

        if (Object.keys(errorsForm).length > 0) {
            return {
                translation: null,
                userErrors: errorsForm
            };
        }

        const {errors: errorsDB, data: savedData} = await (async (data) => {
            try {
                const errors: any = [];
                const output: any = {};

                const translation: TTranslationModel|null = await Translation.create({userId, projectId, structureId, subjectId, ...data.translation});
                if (isErrorTranslation(translation)) {
                    throw new Error('Failed to add translation');
                }

                const {id: translationId} = translation;
                output.translationId = translationId;

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
                translation: null,
                userErrors: errorsDB
            }
        }

        const {errors: errorsRes, data: obtainedData} = await (async (data): Promise<{errors: any, data: {translation: TTranslation|null}}> => {
            try {
                const errors: any = [];
                let output: {translation: TTranslation|null} = {translation: null};

                const {translationId} = data;

                const translation: TTranslationModel|null = await Translation.findOne({_id: translationId, userId, projectId, structureId, subjectId});
                if (isErrorTranslation(translation)) {
                    output.translation = null;
                } else {
                    output.translation = {
                        id: translation.id,
                        userId: translation.userId,
                        projectId: translation.projectId,
                        structureId: translation.structureId,
                        subjectId: translation.subjectId,
                        subject: translation.subject,
                        createdAt: translation.createdAt,
                        lang: translation.lang,
                        key: translation.key,
                        value: translation.value,
                    }
                }

                return {errors, data: output};
            } catch (e) {
                let message;
                if (e instanceof Error) {
                    message = e.message;
                }
                return {errors: [{message}], data: {translation: null}};
            }
        })(savedData);
        if (Object.keys(errorsRes).length > 0) {
            return {
                translation: null,
                userErrors: errorsRes
            }
        }

        return {
            translation: obtainedData.translation,
            userErrors: []
        };
    } catch (e) {
        let message;
        if (e instanceof Error) {
            message = e.message;
        }
        return {
            translation: null,
            userErrors: [{message}]
        };
    }
}