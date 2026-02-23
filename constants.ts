import { ProcessCapability } from './types';

export const MANUFACTURING_PROCESSES: ProcessCapability[] = [
  { process: 'CNC Milling (Standard)', typicalTol: 0.05, minCpk: 1.33, costFactor: 2 },
  { process: 'CNC Milling (Precision)', typicalTol: 0.01, minCpk: 1.33, costFactor: 4 },
  { process: 'Turning (Standard)', typicalTol: 0.05, minCpk: 1.33, costFactor: 2 },
  { process: 'Grinding', typicalTol: 0.005, minCpk: 1.67, costFactor: 5 },
  { process: 'Injection Molding (General)', typicalTol: 0.2, minCpk: 1.33, costFactor: 1 },
  { process: 'Injection Molding (Technical)', typicalTol: 0.05, minCpk: 1.33, costFactor: 3 },
  { process: '3D Printing (FDM)', typicalTol: 0.3, minCpk: 1.0, costFactor: 1 },
  { process: '3D Printing (SLA)', typicalTol: 0.1, minCpk: 1.0, costFactor: 2 },
  { process: 'Sheet Metal Bending', typicalTol: 0.5, minCpk: 1.0, costFactor: 1 },
];

export const IT_GRADES = [
  { grade: 'IT5', desc: 'Precision Engineering (Grinding)', val: 0.01 }, // Simplified relative
  { grade: 'IT7', desc: 'High Quality Machining (Milling/Turning)', val: 0.03 },
  { grade: 'IT9', desc: 'General Machining', val: 0.1 },
  { grade: 'IT11', desc: 'Punching / Coarse Machining', val: 0.3 },
  { grade: 'IT13', desc: 'Casting / Forging', val: 1.0 },
];
