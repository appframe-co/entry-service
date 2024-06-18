import express, { Request, Response, NextFunction } from 'express'
import SectionsController from '@/controllers/section/sections.controller'
import NewSectionController from '@/controllers/section/new-section.controller'
import EditSectionController from '@/controllers/section/edit-section.controller'
import SectionController from '@/controllers/section/section.controller'
import DeleteSectionController from '@/controllers/section/delete-section.controller'
import CountSectionController from '@/controllers/section/count-sections.controller'
import { TParameters, TSectionInput } from '@/types/types'

const router = express.Router();

type TQueryGet = {
    userId: string;
    projectId: string;
    structureId: string;
    limit: string;
    page: string;
    sinceId: string;
    ids: string;
    parent_id: string;
    depth_level: string;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, projectId, structureId, limit, page, sinceId, ids, parent_id:parentId, depth_level:depthLevel } = req.query as TQueryGet;

        const parameters: TParameters = {};
        if (limit) {
            parameters.limit = +limit;
        }
        if (page) {
            parameters.page = +page;
        }
        if (sinceId) {
            parameters.sinceId = sinceId;
        }
        if (ids) {
            parameters.ids = ids;
        }
        if (parentId) {
            parameters.parentId = parentId;
        }
        if (depthLevel) {
            parameters.depthLevel = +depthLevel;
        }

        const data = await SectionsController({
            userId,
            projectId,
            structureId
        }, 
        parameters);

        res.json(data);
    } catch (e) {

        let message = String(e);

        if (e instanceof Error) {
            message = e.message; 
        }

        res.json({error: 'server_error', description: message});
    }
});

router.get('/count', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, projectId, structureId } = req.query as {userId: string, projectId: string, structureId: string};

        const data = await CountSectionController({
            userId,
            projectId,
            structureId,
        });

        res.json(data);
    } catch (e) {
        let message = String(e);

        if (e instanceof Error) {
            message = e.message; 
        }

        res.json({error: 'server_error', description: message});
    }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let {userId, projectId, structureId, parentId, doc}: TSectionInput = req.body;

        const data = await NewSectionController({
            projectId,
            structureId,
            parentId,
            userId,
            doc
        });

        res.json(data);
    } catch (e) {
        let message = String(e);

        if (e instanceof Error) {
            message = e.message; 
        }

        res.json({error: 'server_error', description: message});
    }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let {id, userId, projectId, structureId, doc}: TSectionInput = req.body;

        if (req.params.id !== id) {
            throw new Error('id invalid');
        }

        const data = await EditSectionController({
            id,
            projectId,
            structureId,
            userId,
            doc
        });

        res.json(data);
    } catch (e) {
        let message = String(e);

        if (e instanceof Error) {
            message = e.message; 
        }

        res.json({error: 'server_error', description: message});
    }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, projectId, structureId} = req.query as {userId: string, projectId: string, structureId: string};
        const { id } = req.params;

        const data = await SectionController({
            userId,
            projectId,
            structureId,
            id
        });

        res.json(data);
    } catch (e) {
        let message = String(e);

        if (e instanceof Error) {
            message = e.message; 
        }

        res.json({error: 'server_error', description: message});
    }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, projectId } = req.query as {userId: string, projectId: string};
        const { id } = req.params;

        const data = await DeleteSectionController({
            userId,
            projectId,
            id
        });

        res.json(data);
    } catch (e) {
        let message = String(e);

        if (e instanceof Error) {
            message = e.message; 
        }

        res.json({error: 'server_error', description: message});
    }
});

export default router;