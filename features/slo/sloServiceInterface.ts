import { SLO } from '../../types/slo';
import { loadInitialSlos } from './sloService';

export interface ISloService {
    loadInitialSlos(): Promise<SLO[]>;
}

export const sloService: ISloService = {
    loadInitialSlos: async () => loadInitialSlos(),
};

export { loadInitialSlos };
