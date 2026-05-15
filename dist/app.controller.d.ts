export declare class AppController {
    health(): {
        succes: boolean;
        donnees: {
            statut: string;
            version: string;
            timestamp: string;
        };
    };
    version(): {
        version: string;
    };
}
