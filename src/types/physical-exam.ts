// ABOUTME: Shared type definitions for physical examination data
// ABOUTME: Ensures consistent interface across components and context

export interface PhysicalExamData {
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: string;
    respiratoryRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
  };
  systems: {
    [systemName: string]: {
      normal: boolean;
      findings: string[];
      notes: string;
    };
  };
  generalAppearance: string;
}