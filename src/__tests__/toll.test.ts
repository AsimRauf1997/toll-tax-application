import { app } from './../index';
import request from 'supertest';
import { TollCalculationService } from '../services/TollCalculationService';
import { EntryPoint } from '../models/TollEntry';

const API_PATH = '/api/toll';

jest.mock('../services/TollCalculationService');

const mockTollCalculationService = TollCalculationService as jest.Mocked<typeof TollCalculationService>;

beforeEach(() => {
  jest.clearAllMocks();
});



describe('Toll API Tests', () => {
  describe('GET /entry-points', () => {
    it('should return all entry points', async () => {
      mockTollCalculationService.getAvailableEntryPoints.mockReturnValue([
        EntryPoint.ZERO_POINT,
        EntryPoint.NS_INTERCHANGE,
        EntryPoint.PH4_INTERCHANGE,
        EntryPoint.FEROZPUR_INTERCHANGE,
        EntryPoint.LAKE_CITY_INTERCHANGE,
        EntryPoint.RAIWAND_INTERCHANGE,
        EntryPoint.BAHRIA_INTERCHANGE
      ]);

      const response = await request(app).get(`${API_PATH}/entry-points`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(7);
    });
  });

  describe('GET /rates', () => {
    it('should return toll rates', async () => {
      const response = await request(app).get(`${API_PATH}/rates`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.baseRate).toBe(20);
    });
  });

  describe('POST /calculate', () => {
    it('should calculate toll for valid input', async () => {
      mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
      mockTollCalculationService.calculateToll.mockReturnValue({
        tollAmount: 50,
        baseToll: 20,
        distanceToll: 30,
        distanceKm: 20,
        discountApplied: 10,
        discountReason: ['Number plate discount'],
        breakdown: {
          baseRate: 20,
          distanceRate: 30,
          weekendMultiplier: 1,
          numberPlateDiscount: 10,
          holidayDiscount: 0,
          finalAmount: 50
        }
      });

      const response = await request(app)
        .post(`${API_PATH}/calculate`)
        .send({
          numberPlate: 'ABC-123',
          entryPoint: 'Zero Point',
          exitPoint: 'NS Interchange',
          entryDateTime: '2025-07-11T08:00:00Z',
          exitDateTime: '2025-07-11T09:00:00Z'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tollAmount).toBe(50);
    },1000000);

    describe('Validation Tests', () => {
      it('should return 400 for missing numberPlate', async () => {
        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toContain('numberPlate');
      });

      it('should return 400 for missing entryPoint', async () => {
        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toContain('entryPoint');
      });

      it('should return 400 for missing exitPoint', async () => {
        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toContain('exitPoint');
      });

      it('should return 400 for missing entryDateTime', async () => {
        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toContain('entryDateTime');
      });

      it('should return 400 for missing exitDateTime', async () => {
        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
        expect(response.body.required).toContain('exitDateTime');
      });

      it('should return 400 for invalid number plate format', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(false);

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC123', // Invalid format
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid number plate format');
        expect(response.body.message).toBe('Number plate must be in format LLL-NNN (e.g., ABC-123)');
      });

      it('should return 400 for number plate with wrong format', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(false);

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'AB-123', // Too short
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid number plate format');
      });
    });

    describe('Different Entry/Exit Points Tests', () => {
      it('should calculate toll for Zero Point to NS Interchange', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 21,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 21
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.distanceKm).toBe(5);
        expect(response.body.data.tollAmount).toBe(21);
      });

      it('should calculate toll for NS Interchange to Bahria Interchange', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 25.8,
          baseToll: 20,
          distanceToll: 5.8,
          distanceKm: 29,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 5.8,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 25.8
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'XYZ-789',
            entryPoint: 'NS Interchange',
            exitPoint: 'Bahria Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.distanceKm).toBe(29);
        expect(response.body.data.tollAmount).toBe(25.8);
      });

      it('should calculate toll for Lake City to Raiwand Interchange', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 21,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 21
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'DEF-456',
            entryPoint: 'Lake City Interchange',
            exitPoint: 'Raiwand Interchange',
            entryDateTime: '2025-07-11T08:00:00Z',
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.distanceKm).toBe(5);
        expect(response.body.data.tollAmount).toBe(21);
      });
    });

    describe('Special Discounts Tests', () => {
      it('should apply weekend multiplier for Saturday travel', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 31.5,
          baseToll: 20,
          distanceToll: 1.5,
          distanceKm: 5,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1.5,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 31.5
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-12T08:00:00Z', // Saturday
            exitDateTime: '2025-07-12T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.breakdown.weekendMultiplier).toBe(1.5);
        expect(response.body.data.tollAmount).toBe(31.5);
      });

      it('should apply weekend multiplier for Sunday travel', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 31.5,
          baseToll: 20,
          distanceToll: 1.5,
          distanceKm: 5,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1.5,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 31.5
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-13T08:00:00Z', // Sunday
            exitDateTime: '2025-07-13T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.breakdown.weekendMultiplier).toBe(1.5);
        expect(response.body.data.tollAmount).toBe(31.5);
      });

      it('should apply holiday discount for March 23', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 10.5,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 10.5,
          discountReason: ['National Holiday (50% discount)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 10.5,
            finalAmount: 10.5
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-03-23T08:00:00Z', // March 23
            exitDateTime: '2025-03-23T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(10.5);
        expect(response.body.data.discountReason).toContain('National Holiday (50% discount)');
        expect(response.body.data.breakdown.holidayDiscount).toBe(10.5);
      });

      it('should apply holiday discount for August 14', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 10.5,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 10.5,
          discountReason: ['National Holiday (50% discount)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 10.5,
            finalAmount: 10.5
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-08-14T08:00:00Z', // August 14
            exitDateTime: '2025-08-14T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(10.5);
        expect(response.body.data.discountReason).toContain('National Holiday (50% discount)');
      });

      it('should apply holiday discount for December 25', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 10.5,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 10.5,
          discountReason: ['National Holiday (50% discount)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 10.5,
            finalAmount: 10.5
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-12-25T08:00:00Z', // December 25
            exitDateTime: '2025-12-25T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(10.5);
        expect(response.body.data.discountReason).toContain('National Holiday (50% discount)');
      });

      it('should apply number plate discount for even number on Monday', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 18.9,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 2.1,
          discountReason: ['Number plate discount (10%)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 2.1,
            holidayDiscount: 0,
            finalAmount: 18.9
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-124', // Even number ending in 4
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-07T08:00:00Z', // Monday
            exitDateTime: '2025-07-07T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(2.1);
        expect(response.body.data.discountReason).toContain('Number plate discount (10%)');
        expect(response.body.data.breakdown.numberPlateDiscount).toBe(2.1);
      });

      it('should apply number plate discount for even number on Wednesday', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 18.9,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 2.1,
          discountReason: ['Number plate discount (10%)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 2.1,
            holidayDiscount: 0,
            finalAmount: 18.9
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-126', // Even number ending in 6
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-09T08:00:00Z', // Wednesday
            exitDateTime: '2025-07-09T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(2.1);
        expect(response.body.data.discountReason).toContain('Number plate discount (10%)');
      });

      it('should apply number plate discount for odd number on Tuesday', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 18.9,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 2.1,
          discountReason: ['Number plate discount (10%)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 2.1,
            holidayDiscount: 0,
            finalAmount: 18.9
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123', // Odd number ending in 3
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-08T08:00:00Z', // Tuesday
            exitDateTime: '2025-07-08T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(2.1);
        expect(response.body.data.discountReason).toContain('Number plate discount (10%)');
      });

      it('should apply number plate discount for odd number on Thursday', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 18.9,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 2.1,
          discountReason: ['Number plate discount (10%)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 2.1,
            holidayDiscount: 0,
            finalAmount: 18.9
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-125', // Odd number ending in 5
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-10T08:00:00Z', // Thursday
            exitDateTime: '2025-07-10T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(2.1);
        expect(response.body.data.discountReason).toContain('Number plate discount (10%)');
      });

      it('should not apply number plate discount for even number on Friday', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 21,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 21
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-124', // Even number ending in 4
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-11T08:00:00Z', // Friday
            exitDateTime: '2025-07-11T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(0);
        expect(response.body.data.discountReason).toHaveLength(0);
        expect(response.body.data.breakdown.numberPlateDiscount).toBe(0);
      });

      it('should not apply number plate discount for odd number on Monday', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 21,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 0,
          discountReason: [],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 0,
            holidayDiscount: 0,
            finalAmount: 21
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123', // Odd number ending in 3
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-07-07T08:00:00Z', // Monday
            exitDateTime: '2025-07-07T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(0);
        expect(response.body.data.discountReason).toHaveLength(0);
        expect(response.body.data.breakdown.numberPlateDiscount).toBe(0);
      });

      it('should apply both holiday and number plate discounts', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 9.45,
          baseToll: 20,
          distanceToll: 1,
          distanceKm: 5,
          discountApplied: 11.55,
          discountReason: ['National Holiday (50% discount)', 'Number plate discount (10%)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1,
            numberPlateDiscount: 1.05,
            holidayDiscount: 10.5,
            finalAmount: 9.45
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-124', // Even number ending in 4
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-03-23T08:00:00Z', // March 23 (Monday)
            exitDateTime: '2025-03-23T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discountApplied).toBe(11.55);
        expect(response.body.data.discountReason).toContain('National Holiday (50% discount)');
        expect(response.body.data.discountReason).toContain('Number plate discount (10%)');
        expect(response.body.data.breakdown.holidayDiscount).toBe(10.5);
        expect(response.body.data.breakdown.numberPlateDiscount).toBe(1.05);
      });

      it('should apply weekend multiplier with holiday discount', async () => {
        mockTollCalculationService.validateNumberPlate.mockReturnValue(true);
        mockTollCalculationService.calculateToll.mockReturnValue({
          tollAmount: 15.75,
          baseToll: 20,
          distanceToll: 1.5,
          distanceKm: 5,
          discountApplied: 15.75,
          discountReason: ['National Holiday (50% discount)'],
          breakdown: {
            baseRate: 20,
            distanceRate: 1,
            weekendMultiplier: 1.5,
            numberPlateDiscount: 0,
            holidayDiscount: 15.75,
            finalAmount: 15.75
          }
        });

        const response = await request(app)
          .post(`${API_PATH}/calculate`)
          .send({
            numberPlate: 'ABC-123',
            entryPoint: 'Zero Point',
            exitPoint: 'NS Interchange',
            entryDateTime: '2025-08-14T08:00:00Z', // August 14 (Thursday)
            exitDateTime: '2025-08-14T09:00:00Z'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.breakdown.weekendMultiplier).toBe(1.5);
        expect(response.body.data.discountApplied).toBe(15.75);
        expect(response.body.data.discountReason).toContain('National Holiday (50% discount)');
      });
    });
  });
});

