-- CreateEnum
CREATE TYPE "EntityDomain" AS ENUM ('Requirements', 'Evidence', 'Personnel', 'FindingsCAPA', 'Reporting', 'Administration');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('NoAccess', 'View', 'Edit', 'Approve');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('MANDATORY_CLAUSE', 'SUPPORTING_REQUIREMENT', 'RECOMMENDED_PRACTICE');

-- CreateEnum
CREATE TYPE "SchemeLifecycleStatus" AS ENUM ('draft', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('Document', 'Record', 'Operational', 'Personnel', 'System');

-- CreateEnum
CREATE TYPE "WitnessResult" AS ENUM ('Pass', 'MinorNC', 'MajorNC', 'Scheduled', 'Outstanding');

-- CreateEnum
CREATE TYPE "AuthorizationRole" AS ENUM ('LeadAuditor', 'Auditor', 'TechnicalExpert', 'Witness');

-- CreateEnum
CREATE TYPE "AuthorizationStatus" AS ENUM ('Active', 'Expired', 'Suspended');

-- CreateEnum
CREATE TYPE "FindingClassification" AS ENUM ('MajorNC', 'MinorNC', 'Observation', 'OFI');

-- CreateEnum
CREATE TYPE "CapaStage" AS ENUM ('Correction', 'RootCause', 'CorrectiveAction', 'Verification', 'Effectiveness', 'Closed');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NotStarted', 'InProgress', 'Done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "Pillar" AS ENUM ('Requirements', 'Evidence', 'Personnel', 'Competence', 'Operations', 'Documentation', 'Assurance', 'CAPA');

-- CreateEnum
CREATE TYPE "ExternalSystemCode" AS ENUM ('PLATFORM_AUDIT', 'AIHCM');

-- CreateEnum
CREATE TYPE "ExternalAuthType" AS ENUM ('JWT', 'ApiKey', 'OAuth2');

-- CreateEnum
CREATE TYPE "ExternalSyncDomain" AS ENUM ('Lifecycle', 'AuditExecution', 'TechnicalReview', 'CertificationDecision', 'PersonnelCompetency');

-- CreateEnum
CREATE TYPE "ExternalSyncStatus" AS ENUM ('Success', 'Partial', 'Failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "entityDomain" "EntityDomain" NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationBody" (
    "id" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "accreditationNumber" TEXT NOT NULL,
    "accreditedSince" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationBody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardVersion" (
    "id" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "supersededDate" TIMESTAMP(3),

    CONSTRAINT "StandardVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clause" (
    "id" TEXT NOT NULL,
    "standardVersionId" TEXT NOT NULL,
    "clauseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "requirementText" TEXT NOT NULL,
    "requirementType" "RequirementType" NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicabilityRule" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "ruleText" TEXT NOT NULL,

    CONSTRAINT "ApplicabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCriteria" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "criteriaText" TEXT NOT NULL,

    CONSTRAINT "ComplianceCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceRequirement" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "EvidenceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "accreditationBodyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "conformityType" TEXT NOT NULL,
    "lifecycleStatus" "SchemeLifecycleStatus" NOT NULL DEFAULT 'draft',
    "clientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeStandard" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SchemeStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "lastAssessed" TIMESTAMP(3),
    "assessedById" TEXT,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "evidenceCode" TEXT NOT NULL,
    "evidenceCategory" "EvidenceCategory" NOT NULL,
    "evidenceStatus" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredDocumentType" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT,
    "typeName" TEXT NOT NULL,
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'Missing',

    CONSTRAINT "RequiredDocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "lastReviewed" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "result" TEXT,
    "externalAuditRef" TEXT,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WitnessCycle" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WitnessCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WitnessEvent" (
    "id" TEXT NOT NULL,
    "witnessCycleId" TEXT NOT NULL,
    "auditorRef" TEXT,
    "abAssessorName" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "result" "WitnessResult" NOT NULL,

    CONSTRAINT "WitnessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditorAuthorization" (
    "id" TEXT NOT NULL,
    "personnelRef" TEXT NOT NULL,
    "schemeId" TEXT,
    "standardRef" TEXT NOT NULL,
    "authorizationRole" "AuthorizationRole" NOT NULL,
    "authorizedSince" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditorAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "findingCode" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "source" TEXT NOT NULL,
    "classification" "FindingClassification" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "ownerUserId" TEXT,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capa" (
    "id" TEXT NOT NULL,
    "capaCode" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "stage" "CapaStage" NOT NULL DEFAULT 'Correction',
    "ownerUserId" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),

    CONSTRAINT "Capa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schemeId" TEXT,
    "sourceRef" TEXT,
    "capaId" TEXT,
    "assigneeUserId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'NotStarted',
    "priority" "TaskPriority" NOT NULL DEFAULT 'Medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "riskCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "schemeId" TEXT,
    "requirementId" TEXT,
    "likelihood" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpartialityDeclaration" (
    "id" TEXT NOT NULL,
    "declarationCode" TEXT NOT NULL,
    "personnelRef" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "reviewedBy" TEXT,

    CONSTRAINT "ImpartialityDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemePillarScore" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "pillar" "Pillar" NOT NULL,
    "scorePct" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemePillarScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessConfig" (
    "id" TEXT NOT NULL,
    "pillar" "Pillar" NOT NULL,
    "weightPct" INTEGER NOT NULL,
    "thresholdReady" INTEGER NOT NULL,
    "thresholdRisks" INTEGER NOT NULL,
    "thresholdNotYetReady" INTEGER NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeAfter" JSONB,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSystem" (
    "id" TEXT NOT NULL,
    "code" "ExternalSystemCode" NOT NULL,
    "displayName" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authType" "ExternalAuthType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExternalSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSyncLog" (
    "id" TEXT NOT NULL,
    "externalSystemId" TEXT NOT NULL,
    "domain" "ExternalSyncDomain" NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "status" "ExternalSyncStatus" NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "ExternalSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_entityDomain_key" ON "RolePermission"("roleId", "entityDomain");

-- CreateIndex
CREATE UNIQUE INDEX "AccreditationBody_accreditationNumber_key" ON "AccreditationBody"("accreditationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_refCode_key" ON "Requirement"("refCode");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeStandard_schemeId_standardId_key" ON "SchemeStandard"("schemeId", "standardId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRecord_requirementId_schemeId_key" ON "ComplianceRecord"("requirementId", "schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_evidenceCode_key" ON "Evidence"("evidenceCode");

-- CreateIndex
CREATE INDEX "AuditorAuthorization_personnelRef_idx" ON "AuditorAuthorization"("personnelRef");

-- CreateIndex
CREATE UNIQUE INDEX "Finding_findingCode_key" ON "Finding"("findingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Capa_capaCode_key" ON "Capa"("capaCode");

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskCode_key" ON "Task"("taskCode");

-- CreateIndex
CREATE UNIQUE INDEX "Risk_riskCode_key" ON "Risk"("riskCode");

-- CreateIndex
CREATE UNIQUE INDEX "ImpartialityDeclaration_declarationCode_key" ON "ImpartialityDeclaration"("declarationCode");

-- CreateIndex
CREATE UNIQUE INDEX "SchemePillarScore_schemeId_pillar_key" ON "SchemePillarScore"("schemeId", "pillar");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessConfig_pillar_key" ON "ReadinessConfig"("pillar");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSystem_code_key" ON "ExternalSystem"("code");

-- CreateIndex
CREATE INDEX "ExternalSyncLog_externalSystemId_domain_idx" ON "ExternalSyncLog"("externalSystemId", "domain");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardVersion" ADD CONSTRAINT "StandardVersion_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clause" ADD CONSTRAINT "Clause_standardVersionId_fkey" FOREIGN KEY ("standardVersionId") REFERENCES "StandardVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityRule" ADD CONSTRAINT "ApplicabilityRule_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCriteria" ADD CONSTRAINT "ComplianceCriteria_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceRequirement" ADD CONSTRAINT "EvidenceRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheme" ADD CONSTRAINT "Scheme_accreditationBodyId_fkey" FOREIGN KEY ("accreditationBodyId") REFERENCES "AccreditationBody"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeStandard" ADD CONSTRAINT "SchemeStandard_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeStandard" ADD CONSTRAINT "SchemeStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "ComplianceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredDocumentType" ADD CONSTRAINT "RequiredDocumentType_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessCycle" ADD CONSTRAINT "WitnessCycle_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WitnessEvent" ADD CONSTRAINT "WitnessEvent_witnessCycleId_fkey" FOREIGN KEY ("witnessCycleId") REFERENCES "WitnessCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditorAuthorization" ADD CONSTRAINT "AuditorAuthorization_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_capaId_fkey" FOREIGN KEY ("capaId") REFERENCES "Capa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpartialityDeclaration" ADD CONSTRAINT "ImpartialityDeclaration_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemePillarScore" ADD CONSTRAINT "SchemePillarScore_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessConfig" ADD CONSTRAINT "ReadinessConfig_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalSyncLog" ADD CONSTRAINT "ExternalSyncLog_externalSystemId_fkey" FOREIGN KEY ("externalSystemId") REFERENCES "ExternalSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
