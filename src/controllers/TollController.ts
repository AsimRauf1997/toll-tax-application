import { Request, Response } from 'express';
import { TollCalculationService } from '../services/TollCalculationService';
import { TollCalculationRequest } from '../models/TollEntry';

export class TollController {
  static calculateToll = (req: Request, res: Response): void => {
    try {
      const { numberPlate, entryPoint, exitPoint, entryDateTime, exitDateTime }: TollCalculationRequest = req.body;

      const entryDate = new Date(entryDateTime);
      const exitDate = new Date(exitDateTime);

      const result = TollCalculationService.calculateToll(
        numberPlate,
        entryPoint,
        exitPoint,
        entryDate,
        exitDate
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Toll calculated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };

  static getEntryPoints = (req: Request, res: Response): void => {
    try {
      const entryPoints = TollCalculationService.getAvailableEntryPoints();
      
      res.status(200).json({
        success: true,
        data: entryPoints,
        message: 'Entry points retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };

  static getTollRates = (req: Request, res: Response): void => {
    try {
      const rates = {
        baseRate: 20,
        distanceRate: 0.2,
        weekendMultiplier: 1.5,
        numberPlateDiscount: 0.1,
        holidayDiscount: 0.5,
        nationalHolidays: ['March 23', 'August 14', 'December 25']
      };

      res.status(200).json({
        success: true,
        data: rates,
        message: 'Toll rates retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };
}
