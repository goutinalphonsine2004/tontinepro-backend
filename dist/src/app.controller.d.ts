export declare class AppController {
    health(): {
        succes: boolean;
        message: string;
        donnees: {
            statut: string;
            version: string;
            timestamp: string;
        };
    };
}
