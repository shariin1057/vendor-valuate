export enum UserRole {
  Admin = 'Admin',
  Evaluator = 'Evaluator'
}

export enum VendorType {
  Transport = 'Transport',
  ManpowerSupply = 'Manpower Supply',
  MachineMaintenance = 'Machine Maintenance',
  GoodsSupply = 'Goods Supply'
}

export enum EvaluationStatus {
  Draft = 'Draft',
  Submitted = 'Submitted'
}

export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

export interface Vendor {
  vendorId: string;
  vendorName: string;
  vendorType: VendorType;
  contactEmail: string;
  status: 'Active' | 'Inactive';
}

export interface TemplateCriteria {
  criteriaId: string;
  criteriaName: string;
  elaboration: string;
  weightage: number;
}

export interface TemplateDepartment {
  departmentName: string;
  departmentWeight: number;
  criteria: TemplateCriteria[];
}

export interface EvaluationTemplate {
  templateId: string;
  vendorType: VendorType;
  structure: TemplateDepartment[];
  lastUpdated: string;
}

export interface EvaluationScore {
  criteriaId: string;
  score: number;
  comment?: string;
}

export interface Evaluation {
  evaluationId: string;
  vendorId: string;
  vendorName: string;
  vendorType: VendorType;
  evaluatorId: string;
  evaluatorName: string;
  department: string;
  submittedDate: string;
  period: string;
  status: EvaluationStatus;
  scores: EvaluationScore[];
  overallScore: number;
  departmentScores: Record<string, number>;
  evidenceUrl?: string;
}

export interface CertificateTemplate {
  id: string;
  title: string;
  bodyTemplate: string; 
  signatureName: string;
  signatureTitle: string;
  borderColor: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  isDefault: boolean;
}

export interface BrandingConfig {
  systemName: string;
  logoUrl: string; 
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface AuditLog {
  logId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SUBMIT';
  entity: string;
  details: string;
}

export interface Period {
  id: string;
  name: string;
  status: 'Open' | 'Locked';
}

export interface ConsolidatedReport {
  reportId: string;
  vendorId: string;
  vendorName: string;
  vendorType: VendorType;
  period: string;
  generatedDate: string;
  finalWeightedScore: number;
  departmentBreakdown: {
    departmentName: string;
    weight: number;
    score: number;
    evaluatorName: string;
    submittedDate: string;
  }[];
  detailedCriteria: {
    department: string;
    criteria: string;
    score: number;
    weight: number;
    comment?: string;
  }[];
}