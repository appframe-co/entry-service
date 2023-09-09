import { RoutesInput } from '@/types/types'
import entry from './entry.route'

export default ({ app }: RoutesInput) => {
    app.use('/api/entries', entry);
};