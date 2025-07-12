import {
  EntryPoint,
  EntryPointDistance,
  TollCalculationResult,
} from "../models/TollEntry";

export class TollCalculationService {
  private static readonly BASE_RATE = 20;
  private static readonly DISTANCE_RATE = 0.2;
  private static readonly WEEKEND_MULTIPLIER = 1.5;
  private static readonly NUMBER_PLATE_DISCOUNT = 0.1;
  private static readonly HOLIDAY_DISCOUNT = 0.5;

  private static readonly ENTRY_POINTS: EntryPointDistance[] = [
    { name: EntryPoint.ZERO_POINT, distanceKm: 0 },
    { name: EntryPoint.NS_INTERCHANGE, distanceKm: 5 },
    { name: EntryPoint.PH4_INTERCHANGE, distanceKm: 10 },
    { name: EntryPoint.FEROZPUR_INTERCHANGE, distanceKm: 17 },
    { name: EntryPoint.LAKE_CITY_INTERCHANGE, distanceKm: 24 },
    { name: EntryPoint.RAIWAND_INTERCHANGE, distanceKm: 29 },
    { name: EntryPoint.BAHRIA_INTERCHANGE, distanceKm: 34 },
  ];

  private static readonly NATIONAL_HOLIDAYS = [
    "03-23", // March 23
    "08-14", // August 14
    "12-25", // December 25
  ];

  static calculateToll(
    numberPlate: string,
    entryPoint: string,
    exitPoint: string,
    entryDateTime: Date,
    exitDateTime: Date
  ): TollCalculationResult {
    const entryData = this.getEntryPointData(entryPoint);
    const exitData = this.getEntryPointData(exitPoint);

    const distanceKm = Math.abs(exitData.distanceKm - entryData.distanceKm);
    const baseToll = this.BASE_RATE;

    let distanceToll = distanceKm * this.DISTANCE_RATE;
    let weekendMultiplier = 1;

    if (this.isWeekend(exitDateTime)) {
      weekendMultiplier = this.WEEKEND_MULTIPLIER;
      distanceToll *= this.WEEKEND_MULTIPLIER;
    }

    let totalAmount = baseToll + distanceToll;
    const discountReasons: string[] = [];
    let numberPlateDiscount = 0;
    let holidayDiscount = 0;

    if (this.isHoliday(entryDateTime)) {
      holidayDiscount = totalAmount * this.HOLIDAY_DISCOUNT;
      totalAmount -= holidayDiscount;
      discountReasons.push("National Holiday (50% discount)");
    }

    const numberPlateDiscountAmount = this.calculateNumberPlateDiscount(
      numberPlate,
      entryDateTime,
      totalAmount
    );

    if (numberPlateDiscountAmount > 0) {
      numberPlateDiscount = numberPlateDiscountAmount;
      totalAmount -= numberPlateDiscountAmount;
      discountReasons.push("Number plate discount (10%)");
    }

    const discountApplied = numberPlateDiscount + holidayDiscount;

    return {
      tollAmount: Math.round(totalAmount * 100) / 100,
      baseToll,
      distanceToll: Math.round(distanceKm * this.DISTANCE_RATE * 100) / 100,
      distanceKm,
      discountApplied: Math.round(discountApplied * 100) / 100,
      discountReason: discountReasons,
      breakdown: {
        baseRate: baseToll,
        distanceRate: Math.round(distanceKm * this.DISTANCE_RATE * 100) / 100,
        weekendMultiplier,
        numberPlateDiscount: Math.round(numberPlateDiscount * 100) / 100,
        holidayDiscount: Math.round(holidayDiscount * 100) / 100,
        finalAmount: Math.round(totalAmount * 100) / 100,
      },
    };
  }

  private static getEntryPointData(entryPointName: string): EntryPointDistance {
    const entryPoint = this.ENTRY_POINTS.find(
      (point) => point.name === entryPointName
    );

    if (!entryPoint) {
      throw new Error(`Invalid entry point: ${entryPointName}`);
    }

    return entryPoint;
  }

  private static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  private static isHoliday(date: Date): boolean {
    const monthDay =
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    return this.NATIONAL_HOLIDAYS.includes(monthDay);
  }

  private static calculateNumberPlateDiscount(
    numberPlate: string,
    entryDate: Date,
    amount: number
  ): number {
    const lastDigit = this.getLastDigitFromNumberPlate(numberPlate);
    const dayOfWeek = entryDate.getDay();

    const isEven = lastDigit % 2 === 0;
    const isOdd = lastDigit % 2 === 1;

    if ((dayOfWeek === 1 || dayOfWeek === 3) && isEven) {
      // Monday or Wednesday, even number
      return amount * this.NUMBER_PLATE_DISCOUNT;
    }

    if ((dayOfWeek === 2 || dayOfWeek === 4) && isOdd) {
      // Tuesday or Thursday, odd number
      return amount * this.NUMBER_PLATE_DISCOUNT;
    }

    return 0;
  }

  private static getLastDigitFromNumberPlate(numberPlate: string): number {
    const match = numberPlate.match(/\d+$/);
    if (!match) {
      throw new Error("Invalid number plate format");
    }
    return parseInt(match[0].slice(-1));
  }

  static validateNumberPlate(numberPlate: string): boolean {
    const pattern = /^[A-Z]{3}-\d{3}$/;
    const result = pattern.test(numberPlate);
    console.log('result', result);
    return result;
  }

  static getAvailableEntryPoints(): EntryPoint[] {
    return this.ENTRY_POINTS.map((point) => point.name);
  }
}
