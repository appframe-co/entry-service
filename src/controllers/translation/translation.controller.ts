import Translation from '@/models/translation.model';
import {TErrorResponse, TStructure, TTranslationInput, TTranslation, TTranslationModel, TValueTranslation} from '@/types/types';

function isErrorStructure(data: TErrorResponse|{structure: TStructure}): data is TErrorResponse {
    return (data as TErrorResponse).error !== undefined;
}

export default async function TranslationController(translationInput: TTranslationInput): Promise<TErrorResponse | {translation: TTranslation}> {
    try {
        const {id, userId, projectId, structureId, subjectId, lang} = translationInput;

        const translation: TTranslationModel|null = await Translation.findOne({_id: id, userId, projectId, structureId, subjectId, lang});
        if (!translation) {
            throw new Error('invalid translation');
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
        const keys = structure.bricks.map(b => b.key);
        const doc: TValueTranslation = {};
        if (translation.value) {
            keys.forEach(key => {
                doc[key] = translation.value.hasOwnProperty(key) ? translation.value[key] : null;
            });
        }

        const output = {
            id: translation.id,
            userId: translation.userId,
            projectId: translation.projectId,
            structureId: translation.structureId,
            subject: translation.subject,
            subjectId: translation.subjectId,
            lang: translation.lang,
            key: translation.key,
            value: translation.value,
            createdAt: translation.createdAt,
        };
        return {translation: output};
    } catch (error) {
        throw error;
    }
}