import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("no hardcoded development passwords remain", () => {
  const patients = read("backend/src/modules/patients/patients.service.ts");
  const seed = read("backend/prisma/seed.ts");
  assert.equal(patients.includes("temporal123"), false);
  assert.equal(seed.includes("admin123"), false);
});

test("patient portal uses own scoped endpoints", () => {
  const appointments = read("frontend/src/app/patient/appointments/page.tsx");
  const budgets = read("frontend/src/app/patient/budgets/page.tsx");
  const treatments = read("frontend/src/app/patient/treatments/page.tsx");
  const payments = read("frontend/src/app/patient/payments/page.tsx");
  assert.equal(appointments.includes("/appointments?patientId"), false);
  assert.equal(budgets.includes("/budgets/patient/"), false);
  assert.equal(treatments.includes("/treatments/patient/"), false);
  assert.equal(payments.includes("/payments/patient/"), false);
});

test("admin and owner settings endpoints are exposed", () => {
  const controller = read("backend/src/modules/dashboard/dashboard.controller.ts");
  for (const route of ["admin/settings", "admin/subscriptions", "admin/audit-logs", "owner/tenant"]) {
    assert.equal(controller.includes(route), true);
  }
});

test("agenda create callback is wired", () => {
  const dentistAgenda = read("frontend/src/app/dentist/agenda/page.tsx");
  const ownerAgenda = read("frontend/src/app/owner/appointments/page.tsx");
  assert.equal(dentistAgenda.includes("onCreateClick={() => {}}"), false);
  assert.equal(ownerAgenda.includes("onCreateClick={() => {}}"), false);
});
