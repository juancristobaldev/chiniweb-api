-- Add tenantId to clinical models for multi-tenant isolation
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE odontograms ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE odontogram_items ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE odontogram_records ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE treatment_stages ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Add anamnesis fields to medical_info
ALTER TABLE medical_info ADD COLUMN IF NOT EXISTS motivo_consulta TEXT;
ALTER TABLE medical_info ADD COLUMN IF NOT EXISTS ultima_visita TIMESTAMPTZ;
ALTER TABLE medical_info ADD COLUMN IF NOT EXISTS sangrado_encias BOOLEAN;
ALTER TABLE medical_info ADD COLUMN IF NOT EXISTS dolor_dental BOOLEAN;
ALTER TABLE medical_info ADD COLUMN IF NOT EXISTS tratamientos_previos JSONB DEFAULT '[]';

-- Add missing indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_boxes_locale_id ON boxes("localeId");
CREATE INDEX IF NOT EXISTS idx_specialties_locale_id ON specialties("localeId");
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients("tenantId");
CREATE INDEX IF NOT EXISTS idx_dentists_tenant_id ON dentists("tenantId");
CREATE INDEX IF NOT EXISTS idx_patients_dentist_id ON patients("dentistId");
CREATE INDEX IF NOT EXISTS idx_treatment_plans_dentist_id ON treatment_plans("dentistId");
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments("paidAt");
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments("createdAt");
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets("createdAt");
CREATE INDEX IF NOT EXISTS idx_clinical_records_type ON clinical_records("type");
CREATE INDEX IF NOT EXISTS idx_clinical_records_is_deleted ON clinical_records("isDeleted");
CREATE INDEX IF NOT EXISTS idx_clinical_records_tenant_id ON clinical_records("tenant_id");
CREATE INDEX IF NOT EXISTS idx_attachments_patient_id ON attachments("patientId");
CREATE INDEX IF NOT EXISTS idx_attachments_tenant_id ON attachments("tenant_id");
CREATE INDEX IF NOT EXISTS idx_treatment_stages_plan_id ON treatment_stages("planId");
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items("budgetId");
CREATE INDEX IF NOT EXISTS idx_dentist_locales_locale_id ON dentist_locales("localeId");
CREATE INDEX IF NOT EXISTS idx_patient_locales_locale_id ON patient_locales("localeId");
CREATE INDEX IF NOT EXISTS idx_odontograms_tenant_id ON odontograms("tenant_id");
CREATE INDEX IF NOT EXISTS idx_odontogram_items_tenant_id ON odontogram_items("tenant_id");
CREATE INDEX IF NOT EXISTS idx_odontogram_records_tenant_id ON odontogram_records("tenant_id");
CREATE INDEX IF NOT EXISTS idx_treatment_plans_tenant_id ON treatment_plans("tenant_id");
CREATE INDEX IF NOT EXISTS idx_treatment_stages_tenant_id ON treatment_stages("tenant_id");

-- Add unique constraint to prevent duplicate odontogram items
ALTER TABLE odontogram_items ADD CONSTRAINT odontogram_items_unique_tooth UNIQUE ("odontogramId", "toothCode", "surface");
