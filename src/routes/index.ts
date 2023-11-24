import { RoutesInput } from '@/types/types'
import entry from './entry.route'
import translation from './translation.route'

export default ({ app }: RoutesInput) => {
    app.use('/api/entries', entry);
    app.use('/api/translations', translation);
};