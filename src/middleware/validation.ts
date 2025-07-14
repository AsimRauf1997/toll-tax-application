import { Request, Response, NextFunction } from 'express';
import { TollCalculationService } from '../services/TollCalculationService';

export const validateTollCalculationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { numberPlate, entryPoint, exitPoint, entryDateTime, exitDateTime } = req.body;

  if (!numberPlate || !entryPoint || !exitPoint || !entryDateTime || !exitDateTime) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['numberPlate', 'entryPoint', 'exitPoint', 'entryDateTime', 'exitDateTime']
    });
    return;
  }

  if (!TollCalculationService.validateNumberPlate(numberPlate)) {
    res.status(400).json({
      error: 'Invalid number plate format',
      message: 'Number plate must be in format LLL-NNN (e.g., ABC-123)'
    });
    return;
  }
  if(entryPoint.toLowerCase()=== exitPoint.toLowerCase()){
      res.status(400).json({
      error: 'Entry and exit points cannot be the same',
      message: 'Please provide different entry and exit points'
    });
    return;
  }

  const availableEntryPoints = TollCalculationService.getAvailableEntryPoints();
  
  if (!availableEntryPoints.includes(entryPoint)) {
    res.status(400).json({
      error: 'Invalid entry point',
      availableEntryPoints
    });
    return;
  }

  if (!availableEntryPoints.includes(exitPoint)) {
    res.status(400).json({
      error: 'Invalid exit point',
      availableEntryPoints
    });
    return;
  }

  const entryDate = new Date(entryDateTime);
  const exitDate = new Date(exitDateTime);

  if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
    res.status(400).json({
      error: 'Invalid date format',
      message: 'Dates must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    });
    return;
  }

  if (exitDate < entryDate) {
    res.status(400).json({
      error: 'Invalid date range',
      message: 'Exit date must be after entry date'
    });
    return;
  }

  next();
};
