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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function boostScore() {
    const clientId = '9fb1ab19-c84d-4192-b144-054d52f09a51';
    await prisma.scoreCredit.upsert({
        where: { utilisateurId: clientId },
        create: {
            utilisateurId: clientId,
            score: 65,
            eligibleMicroCredit: true,
            tauxRegularite: 0.8,
            totalDepots: 20,
            totalMois: 1,
            scoreRemboursement: 1,
            dernierCalcul: new Date()
        },
        update: {
            score: 65,
            eligibleMicroCredit: true,
            tauxRegularite: 0.8,
            totalDepots: 20,
            dernierCalcul: new Date()
        }
    });
    console.log('Score de Paul boosté à 65 pour le test.');
    await prisma.$disconnect();
    process.exit(0);
}
boostScore().catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=boost-score.js.map