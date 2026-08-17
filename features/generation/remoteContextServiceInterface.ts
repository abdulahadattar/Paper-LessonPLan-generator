export interface RemotePdf {
    name: string;
    grade: string;
    unit: string;
    url: string;
}

export interface IRemoteContextService {
    getRemotePdfs(): RemotePdf[];
}

import { getRemotePdfs } from './remoteContextService';

export const remoteContextService: IRemoteContextService = {
    getRemotePdfs: () => getRemotePdfs(),
};

export { getRemotePdfs };
