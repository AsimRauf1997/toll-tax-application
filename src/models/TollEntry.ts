export interface TollEntry {
  id: string;
  numberPlate: string;
  entryPoint: EntryPoint;
  entryDateTime: Date;
}

export interface TollExit {
  id: string;
  numberPlate: string;
  exitPoint: EntryPoint;
  exitDateTime: Date;
}

export interface TollCalculationResult {
  tollAmount: number;
  baseToll: number;
  distanceToll: number;
  distanceKm: number;
  discountApplied: number;
  discountReason: string[];
  breakdown: {
    baseRate: number;
    distanceRate: number;
    weekendMultiplier: number;
    numberPlateDiscount: number;
    holidayDiscount: number;
    finalAmount: number;
  };
}

export interface TollCalculationRequest {
  numberPlate: string;
  entryPoint: string;
  exitPoint: string;
  entryDateTime: string;
  exitDateTime: string;
}

export enum EntryPoint {
  ZERO_POINT = 'Zero Point',
  NS_INTERCHANGE = 'NS Interchange',
  PH4_INTERCHANGE = 'Ph4 Interchange',
  FEROZPUR_INTERCHANGE = 'Ferozpur Interchange',
  LAKE_CITY_INTERCHANGE = 'Lake City Interchange',
  RAIWAND_INTERCHANGE = 'Raiwand Interchange',
  BAHRIA_INTERCHANGE = 'Bahria Interchange'
}

export interface EntryPointDistance {
  name: EntryPoint;
  distanceKm: number;
}
