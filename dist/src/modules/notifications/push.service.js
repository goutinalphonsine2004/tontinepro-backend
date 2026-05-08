"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
let PushService = PushService_1 = class PushService {
    config;
    logger = new common_1.Logger(PushService_1.name);
    initialized = false;
    constructor(config) {
        this.config = config;
        const projectId = config.get('FIREBASE_PROJECT_ID');
        const privateKey = config.get('FIREBASE_PRIVATE_KEY');
        const clientEmail = config.get('FIREBASE_CLIENT_EMAIL');
        if (projectId && privateKey && clientEmail) {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                        clientEmail,
                    }),
                });
            }
            this.initialized = true;
            this.logger.log('[Push] Firebase initialisé');
        }
        else {
            this.logger.warn('[Push] Firebase non configuré — push désactivé');
        }
    }
    async envoyerNotification(token, titre, corps, donnees) {
        if (!this.initialized) {
            this.logger.warn(`[Push] Simulation → ${titre}: ${corps}`);
            return { success: true, simulated: true };
        }
        try {
            const result = await admin.messaging().send({
                token,
                notification: { title: titre, body: corps },
                data: donnees ?? {},
                android: { priority: 'high' },
                apns: { payload: { aps: { sound: 'default', badge: 1 } } },
            });
            this.logger.log(`[Push] Envoyé: ${result}`);
            return { success: true, messageId: result };
        }
        catch (err) {
            this.logger.error(`[Push] Erreur: ${err.message}`);
            return { success: false, erreur: err.message };
        }
    }
    async envoyerAMultiple(tokens, titre, corps, donnees) {
        if (!this.initialized || tokens.length === 0)
            return;
        const messages = tokens.map((token) => ({
            token,
            notification: { title: titre, body: corps },
            data: donnees ?? {},
        }));
        try {
            const result = await admin.messaging().sendEach(messages);
            this.logger.log(`[Push Multi] ${result.successCount}/${tokens.length} envoyés`);
            return result;
        }
        catch (err) {
            this.logger.error(`[Push Multi] Erreur: ${err.message}`);
        }
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PushService);
//# sourceMappingURL=push.service.js.map