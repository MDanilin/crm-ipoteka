// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'supervisor' | 'manager' | 'analyst' | 'agent' | 'operator' | 'dsa';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  login: string;
  phone: string;
  role: UserRole;
  dept: string;
  tab: string;
  status: UserStatus;
  clients_count: number;
  last_login: string | null;
  initials: string;
  created_at: string;
}

export interface LoginRequest  { login: string; password: string; }
export interface LoginResponse { token: string; user: User; }

// ── Clients ───────────────────────────────────────────────────────────────────

export type ClientType    = 'Крупный бизнес' | 'МСП' | 'Холдинг' | 'Международные';
export type ClientTypeEn  = 'large' | 'sme' | 'holding' | 'international';
export type ClientStatus  = 'active' | 'pending' | 'inactive';
export type RiskLevel     = 'low' | 'medium' | 'high';
export type Segment       = 'Standard' | 'Premium';

export interface Client {
  id: number;
  name: string;
  short_name: string;
  type: ClientType;
  type_en: ClientTypeEn;
  inn: string;
  kpp: string;
  ogrn: string;
  industry: string;
  manager: string;
  status: ClientStatus;
  rating: string;
  revenue: string;
  last_contact: string;
  city: string;
  phone: string;
  email: string;
  employees: string;
  segment: Segment;
  risk_level: RiskLevel;
  balance: string;
  credit_limit: string;
  created_at: string;
  products?: string[] | Product[];
}

export interface ClientDetail extends Client {
  contacts:  Contact[];
  products:  Product[];
  docs:      Document[];
  comms:     Communication[];
  tasks:     Task[];
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export interface Contact {
  id: number;
  client_id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  is_primary: number;
  created_at: string;
}

// ── Products ──────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'expired' | 'pending';

export interface Product {
  id: number;
  client_id: number;
  name: string;
  number: string;
  limit_val: string;
  used_val: string;
  rate: string;
  opened: string;
  expires: string;
  status: ProductStatus;
  usage_pct: number;
  created_at: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskType     = 'call' | 'meeting' | 'proposal' | 'document' | 'analysis';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: number;
  title: string;
  client_id: number | null;
  client_name: string;
  type: TaskType;
  priority: TaskPriority;
  due: string;
  done: number;
  manager: string;
  comment: string;
  created_at: string;
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export type LeadStatus = 'new' | 'in_progress' | 'meeting' | 'account_opened' | 'qualified' | 'proposal' | 'converted' | 'lost';

export interface Lead {
  id: number;
  name: string;
  contact: string;
  phone: string;
  inn: string;
  source: string;
  branch: string;
  agent_name: string;
  status: LeadStatus;
  product: string;
  amount: number;
  manager: string;
  stage_times: string;
  lost_reason: string;
  created_at: string;
}

export interface LostAnalytics {
  total: number;
  this_month: number;
  by_reason:  { reason: string; count: number }[];
  by_source:  { source: string; count: number }[];
  by_manager: { manager: string; count: number }[];
}

export interface HQChannelStat {
  channel: string;
  total: number;
  converted: number;
  lost: number;
  active: number;
  conversion_pct: number;
  avg_days: number | null;
  funnel: { new: number; in_progress: number; meeting: number; account_opened: number; converted: number; lost: number };
}

export interface HQEmployeeStat {
  name: string;
  leads: number;
  converted: number;
  conversion_pct: number;
  avg_days: number | null;
  calls: number;
  meetings: number;
  tasks: number;
}

export interface HQAnalytics {
  period_days: number;
  total: number;
  converted: number;
  conversion_pct: number;
  avg_days: number | null;
  by_channel: HQChannelStat[];
  by_employee: HQEmployeeStat[];
}

export type ActivityType = 'call' | 'meeting' | 'task' | 'note';

export interface LeadActivity {
  id: number;
  lead_id: number;
  type: ActivityType;
  summary: string;
  date: string;
  manager: string;
  result: string;
  created_at: string;
}

export interface LeadTransfer {
  id: number;
  lead_id: number;
  from_user: string;
  to_user: string;
  reason: string;
  transferred_by: string;
  created_at: string;
}

export interface LeadDetail extends Lead {
  activities: LeadActivity[];
  transfers: LeadTransfer[];
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export type CampaignStatus        = 'draft' | 'active' | 'completed';
export type ContactCallStatus     = 'pending' | 'no_answer' | 'not_interested' | 'callback' | 'meeting' | 'lead_created';

export interface Campaign {
  id:           number;
  name:         string;
  source:       string;
  status:       CampaignStatus;
  total:        number;
  pending:      number;
  processed:    number;
  created_at:   string;
}

export interface CampaignContact {
  id:           number;
  campaign_id:  number;
  company:      string;
  inn:          string;
  contact_name: string;
  phone:        string;
  assigned_to:  string;
  call_status:  ContactCallStatus;
  result_note:  string;
  called_at:    string | null;
  is_duplicate: number;
  created_at:   string;
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export type PipelineStage = 'qualification' | 'proposal' | 'negotiation' | 'approval' | 'closed';

export interface Deal {
  id: number;
  client_name: string;
  client_id: number | null;
  product: string;
  stage: PipelineStage;
  amount: string;
  amount_raw: number;
  probability: number;
  manager: string;
  close_date: string;
  created_at: string;
}

// ── Communications ────────────────────────────────────────────────────────────

export type CommType = 'call' | 'email' | 'meeting';

export interface Communication {
  id: number;
  client_id: number | null;
  type: CommType;
  date: string;
  summary: string;
  contact: string;
  duration: string;
  manager: string;
  result: string;
  created_at: string;
  client_name?: string;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface Document {
  id: number;
  client_id: number | null;
  name: string;
  icon: string;
  date: string;
  size: string;
  file_url: string;
  created_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  clientCount:   number;
  activeDeals:   number;
  openTasks:     number;
  pipelineTotal: string;
  myClients:     Client[];
  todayTasks:    Task[];
  recentComms:   Communication[];
}

// ── API helpers ───────────────────────────────────────────────────────────────

export interface ApiError { error: string; }

export interface SearchResult {
  clients: Pick<Client, 'id' | 'name' | 'city' | 'industry'>[];
  tasks:   Pick<Task,   'id' | 'title' | 'client_name'>[];
  leads:   Pick<Lead,   'id' | 'name' | 'contact'>[];
}

// ── Integration stubs (Phase 2) ───────────────────────────────────────────────

export interface SbpPaymentRequest {
  amount:    number;
  currency:  'RUB' | 'UZS';
  clientId:  number;
  reference: string;
}

export interface FnsNpdStatus {
  inn:       string;
  isNpd:     boolean;
  checkedAt: string;
}

export type EdoDocumentStatus = 'draft' | 'sent' | 'signed' | 'rejected';

export interface EdoDocument {
  id:       string;
  clientId: number;
  type:     string;
  status:   EdoDocumentStatus;
  url:      string;
}
