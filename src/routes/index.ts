import { RoutesInput } from '@/types/types'
import entry from './entry.route'
import section from './section.route'
import translation from './translation.route'

export default ({ app }: RoutesInput) => {
    app.use('/api/entries', entry);
    app.use('/api/sections', section);
    app.use('/api/translations', translation);
};