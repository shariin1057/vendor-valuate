import { User, UserRole, Vendor, VendorType, EvaluationTemplate, Evaluation, EvaluationStatus, CertificateTemplate, BrandingConfig, AuditLog, Period, ConsolidatedReport } from '../types';

// Seed Data
const SEED_USERS: User[] = [
  { userId: 'u1', email: 'admin@hartagroup.my', displayName: 'System Admin', role: UserRole.Admin, department: 'IT', isActive: true },
  { userId: 'u2', email: 'eval@portal.com', displayName: 'Jane Ops', role: UserRole.Evaluator, department: 'Operations', isActive: true },
  { userId: 'u3', email: 'finance@portal.com', displayName: 'Frank Finance', role: UserRole.Evaluator, department: 'Finance', isActive: true },
  { userId: 'u4', email: 'safety@portal.com', displayName: 'Sam Safety', role: UserRole.Evaluator, department: 'Safety', isActive: true }
];

const SEED_VENDORS: Vendor[] = [
  { vendorId: 'v1', vendorName: 'FastTrans Logistics', vendorType: VendorType.Transport, contactEmail: 'info@fasttrans.com', status: 'Active' },
  { vendorId: 'v2', vendorName: 'SecureGuard Inc', vendorType: VendorType.ManpowerSupply, contactEmail: 'contact@secureguard.com', status: 'Active' },
  { vendorId: 'v3', vendorName: 'TechFix Solutions', vendorType: VendorType.MachineMaintenance, contactEmail: 'support@techfix.com', status: 'Active' }
];

const SEED_TEMPLATES: EvaluationTemplate[] = [
  {
    templateId: 't1',
    vendorType: VendorType.Transport,
    lastUpdated: new Date().toISOString(),
    structure: [
      {
        departmentName: 'Operations',
        departmentWeight: 50,
        criteria: [
          { criteriaId: 'c1', criteriaName: 'Timeliness', elaboration: 'Adherence to schedule', weightage: 50 },
          { criteriaId: 'c2', criteriaName: 'Vehicle Condition', elaboration: 'Safety and cleanliness', weightage: 30 },
          { criteriaId: 'c3', criteriaName: 'Driver Conduct', elaboration: 'Professionalism', weightage: 20 }
        ]
      },
      {
        departmentName: 'Finance',
        departmentWeight: 30,
        criteria: [
          { criteriaId: 'c4', criteriaName: 'Billing Accuracy', elaboration: 'Correct invoices', weightage: 50 },
          { criteriaId: 'c5', criteriaName: 'Cost Efficiency', elaboration: 'Competitive pricing', weightage: 50 }
        ]
      },
      {
        departmentName: 'Safety',
        departmentWeight: 20,
        criteria: [
          { criteriaId: 'c9', criteriaName: 'Accident Rate', elaboration: 'Zero accidents in period', weightage: 60 },
          { criteriaId: 'c10', criteriaName: 'Compliance', elaboration: 'Adherence to safety protocols', weightage: 40 }
        ]
      }
    ]
  }
];

const SEED_PERIODS: Period[] = [
  { id: 'p1', name: '2023-Q4', status: 'Locked' },
  { id: 'p2', name: '2024-Q1', status: 'Open' }
];

const DEFAULT_BRANDING: BrandingConfig = {
  systemName: 'VendorValuate',
  logoUrl: '',
  primaryColor: '#0f6cbd',
  secondaryColor: '#002b50',
  accentColor: '#2563eb'
};

const KEYS = {
  USERS: 'vv_users',
  VENDORS: 'vv_vendors',
  TEMPLATES: 'vv_templates',
  EVALUATIONS: 'vv_evaluations',
  PERIODS: 'vv_periods',
  CERTIFICATES: 'vv_certificates',
  BRANDING: 'vv_branding',
  LOGS: 'vv_audit_logs',
  REPORTS: 'vv_consolidated_reports',
  CURRENT_USER: 'vv_current_user_meta'
};

const initData = () => {
  if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
  if (!localStorage.getItem(KEYS.VENDORS)) localStorage.setItem(KEYS.VENDORS, JSON.stringify(SEED_VENDORS));
  if (!localStorage.getItem(KEYS.TEMPLATES)) localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
  if (!localStorage.getItem(KEYS.EVALUATIONS)) localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify([]));
  if (!localStorage.getItem(KEYS.PERIODS)) localStorage.setItem(KEYS.PERIODS, JSON.stringify(SEED_PERIODS));
  if (!localStorage.getItem(KEYS.BRANDING)) localStorage.setItem(KEYS.BRANDING, JSON.stringify(DEFAULT_BRANDING));
  if (!localStorage.getItem(KEYS.LOGS)) localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
  if (!localStorage.getItem(KEYS.REPORTS)) localStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
};

initData();

const logAction = (action: AuditLog['action'], entity: string, details: string) => {
  try {
    const userMeta = localStorage.getItem(KEYS.CURRENT_USER);
    const user = userMeta ? JSON.parse(userMeta) : { userId: 'system', displayName: 'System' };
    const log: AuditLog = {
      logId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: user.userId,
      userName: user.displayName,
      action,
      entity,
      details
    };
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    logs.unshift(log);
    if(logs.length > 500) logs.length = 500;
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  } catch (e) { console.error("Audit logging failed", e); }
};

export const db = {
  auth: {
    setCurrentUser: (user: User) => localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({ userId: user.userId, displayName: user.displayName })),
    logout: () => localStorage.removeItem(KEYS.CURRENT_USER)
  },
  logs: {
    getAll: (): AuditLog[] => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
    clear: () => localStorage.setItem(KEYS.LOGS, '[]')
  },
  users: {
    getAll: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
    add: (user: User) => {
        const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
        users.push(user);
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        logAction('CREATE', 'User', `Created user: ${user.email}`);
    },
    update: (user: User) => {
      const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]').map((u: User) => u.userId === user.userId ? user : u);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      logAction('UPDATE', 'User', `Updated user: ${user.email}`);
    },
    toggleStatus: (userId: string) => {
        const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
        const idx = users.findIndex((u: User) => u.userId === userId);
        if (idx >= 0) {
            users[idx].isActive = !users[idx].isActive;
            localStorage.setItem(KEYS.USERS, JSON.stringify(users));
            logAction('UPDATE', 'User', `Toggled status for ${users[idx].email}`);
        }
    }
  },
  vendors: {
    getAll: (): Vendor[] => JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]'),
    add: (vendor: Vendor) => {
      const list = JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]');
      list.push(vendor);
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(list));
      logAction('CREATE', 'Vendor', `Added vendor: ${vendor.vendorName}`);
    },
    update: (vendor: Vendor) => {
      const list = JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]').map((v: Vendor) => v.vendorId === vendor.vendorId ? vendor : v);
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(list));
      logAction('UPDATE', 'Vendor', `Updated vendor: ${vendor.vendorName}`);
    },
    delete: (id: string) => {
      const list = JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]');
      const newList = list.filter((i: Vendor) => i.vendorId !== id);
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(newList));
      logAction('DELETE', 'Vendor', `Deleted vendor ID: ${id}`);
    },
    toggleStatus: (id: string) => {
      const list = JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]');
      const idx = list.findIndex((v: Vendor) => v.vendorId === id);
      if (idx >= 0) {
        list[idx].status = list[idx].status === 'Active' ? 'Inactive' : 'Active';
        localStorage.setItem(KEYS.VENDORS, JSON.stringify(list));
        logAction('UPDATE', 'Vendor', `Set ${list[idx].vendorName} to ${list[idx].status}`);
      }
    },
    upsertBulk: (vendors: Vendor[]) => {
      const current = JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]');
      vendors.forEach(v => {
        const idx = current.findIndex((c: Vendor) => c.vendorId === v.vendorId || c.vendorName === v.vendorName);
        if (idx >= 0) current[idx] = { ...current[idx], ...v };
        else current.push(v);
      });
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(current));
      logAction('UPDATE', 'Vendor', `Bulk upserted ${vendors.length} vendors`);
    }
  },
  templates: {
    getByType: (type: VendorType): EvaluationTemplate | undefined => {
      const list: EvaluationTemplate[] = JSON.parse(localStorage.getItem(KEYS.TEMPLATES) || '[]');
      return list.find(t => t.vendorType === type);
    },
    getAll: (): EvaluationTemplate[] => JSON.parse(localStorage.getItem(KEYS.TEMPLATES) || '[]'),
    save: (template: EvaluationTemplate) => {
      let list: EvaluationTemplate[] = JSON.parse(localStorage.getItem(KEYS.TEMPLATES) || '[]');
      const idx = list.findIndex(t => t.vendorType === template.vendorType);
      if (idx >= 0) list[idx] = template;
      else list.push(template);
      localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(list));
      logAction('UPDATE', 'Template', `Updated template for ${template.vendorType}`);
    }
  },
  evaluations: {
    getAll: (): Evaluation[] => JSON.parse(localStorage.getItem(KEYS.EVALUATIONS) || '[]'),
    add: (evaluation: Evaluation) => {
      const list = JSON.parse(localStorage.getItem(KEYS.EVALUATIONS) || '[]');
      const filtered = list.filter((e: Evaluation) => !(e.vendorId === evaluation.vendorId && e.period === evaluation.period && e.department === evaluation.department));
      filtered.push(evaluation);
      localStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(filtered));
      logAction('SUBMIT', 'Evaluation', `Submitted evaluation for ${evaluation.vendorName}`);
    },
    getByEvaluator: (id: string) => JSON.parse(localStorage.getItem(KEYS.EVALUATIONS) || '[]').filter((e: Evaluation) => e.evaluatorId === id)
  },
  periods: {
    getAll: (): Period[] => JSON.parse(localStorage.getItem(KEYS.PERIODS) || '[]'),
    toggleStatus: (id: string) => {
      const list: Period[] = JSON.parse(localStorage.getItem(KEYS.PERIODS) || '[]');
      const idx = list.findIndex(p => p.id === id);
      if (idx >= 0) {
        list[idx].status = list[idx].status === 'Open' ? 'Locked' : 'Open';
        localStorage.setItem(KEYS.PERIODS, JSON.stringify(list));
        logAction('UPDATE', 'Period', `Toggled period ${list[idx].name}`);
      }
    },
    add: (name: string) => {
      const list: Period[] = JSON.parse(localStorage.getItem(KEYS.PERIODS) || '[]');
      if (!list.find(p => p.name === name)) {
        list.push({ id: crypto.randomUUID(), name, status: 'Open' });
        localStorage.setItem(KEYS.PERIODS, JSON.stringify(list));
        logAction('CREATE', 'Period', `Opened new period: ${name}`);
      }
    }
  },
  reports: {
    getAll: (): ConsolidatedReport[] => JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]'),
    add: (report: ConsolidatedReport) => {
      const list = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
      const idx = list.findIndex((r: ConsolidatedReport) => r.vendorId === report.vendorId && r.period === report.period);
      if (idx >= 0) list[idx] = report;
      else list.push(report);
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(list));
      logAction('CREATE', 'Report', `Generated consolidated report for ${report.vendorName}`);
    },
    get: (vendorId: string, period: string) => {
      return JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]').find((r: ConsolidatedReport) => r.vendorId === vendorId && r.period === period);
    }
  },
  certificates: {
    getAll: (): CertificateTemplate[] => JSON.parse(localStorage.getItem(KEYS.CERTIFICATES) || '[]'),
    save: (template: CertificateTemplate) => {
      let list: CertificateTemplate[] = JSON.parse(localStorage.getItem(KEYS.CERTIFICATES) || '[]');
      if (template.isDefault) list = list.map(t => ({ ...t, isDefault: false }));
      const idx = list.findIndex(t => t.id === template.id);
      if (idx >= 0) list[idx] = template;
      else list.push(template);
      localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(list));
      logAction('UPDATE', 'Certificate', `Updated template: ${template.title}`);
    }
  },
  branding: {
    get: (): BrandingConfig => JSON.parse(localStorage.getItem(KEYS.BRANDING) || JSON.stringify(DEFAULT_BRANDING)),
    save: (config: BrandingConfig) => {
      localStorage.setItem(KEYS.BRANDING, JSON.stringify(config));
      logAction('UPDATE', 'Branding', 'System branding updated');
    }
  }
};