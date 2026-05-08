import { NotificationsService } from './notifications.service';
import { EnregistrerTokenDto } from './dto/enregistrer-token.dto';
export declare class NotificationsController {
    private service;
    constructor(service: NotificationsService);
    enregistrerToken(u: any, dto: EnregistrerTokenDto): Promise<{
        succes: boolean;
        message: string;
    }>;
}
