import { Router } from 'express';
import { TollController } from '../controllers/TollController';
import { validateTollCalculationRequest } from '../middleware/validation';

const router = Router();

router.post('/calculate', validateTollCalculationRequest, TollController.calculateToll);
router.get('/entry-points', TollController.getEntryPoints);
router.get('/rates', TollController.getTollRates);

export default router;
