-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "corePoolSize" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "roleType" TEXT,
    "tree" TEXT NOT NULL,
    "tenets" TEXT NOT NULL,
    "scoringRubric" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoleScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    CONSTRAINT "RoleScenario_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoleScenario_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenExpiry" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candidate_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "stage1Data" TEXT,
    "stage2Data" TEXT,
    "stage3Data" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assessment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "clientFocused" REAL NOT NULL DEFAULT 0,
    "empowering" REAL NOT NULL DEFAULT 0,
    "productive" REAL NOT NULL DEFAULT 0,
    "balanced" REAL NOT NULL DEFAULT 0,
    "reliable" REAL NOT NULL DEFAULT 0,
    "improving" REAL NOT NULL DEFAULT 0,
    "transparent" REAL NOT NULL DEFAULT 0,
    "roleFitScore" REAL NOT NULL DEFAULT 0,
    "behavioralScore" REAL NOT NULL DEFAULT 0,
    "compositeScore" REAL NOT NULL DEFAULT 0,
    "breakdown" TEXT,
    "aiAnalysis" TEXT,
    "scoredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleScenario_roleId_scenarioId_key" ON "RoleScenario"("roleId", "scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_token_key" ON "Candidate"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_candidateId_key" ON "Assessment"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_assessmentId_key" ON "Score"("assessmentId");
