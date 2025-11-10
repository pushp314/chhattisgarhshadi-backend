-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'PREMIUM_USER', 'VERIFIED_USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE', 'ANNULLED');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'PARSI', 'JEWISH', 'BAHAI', 'NO_RELIGION', 'SPIRITUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "Caste" AS ENUM ('GENERAL', 'OBC', 'SC', 'ST', 'OTHER');

-- CreateEnum
CREATE TYPE "MotherTongue" AS ENUM ('CHHATTISGARHI', 'HINDI', 'ENGLISH', 'TAMIL', 'TELUGU', 'MALAYALAM', 'KANNADA', 'MARATHI', 'GUJARATI', 'BENGALI', 'PUNJABI', 'URDU', 'ODIA', 'ASSAMESE', 'KONKANI', 'KASHMIRI', 'SANSKRIT', 'SINDHI', 'NEPALI', 'MANIPURI', 'BODO', 'DOGRI', 'MAITHILI', 'SANTALI', 'OTHER');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'INTERMEDIATE', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE', 'POST_DOCTORATE', 'PROFESSIONAL_DEGREE', 'OTHER');

-- CreateEnum
CREATE TYPE "OccupationType" AS ENUM ('SALARIED', 'BUSINESS', 'PROFESSIONAL', 'SELF_EMPLOYED', 'NOT_WORKING', 'STUDENT', 'RETIRED');

-- CreateEnum
CREATE TYPE "MatchRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_REQUEST', 'MATCH_ACCEPTED', 'MATCH_REJECTED', 'NEW_MESSAGE', 'PROFILE_VIEW', 'SHORTLISTED', 'SUBSCRIPTION_EXPIRY', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROFILE_VERIFIED', 'PROFILE_REJECTED', 'SYSTEM_ALERT', 'SECURITY_ALERT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PROFILE_PHOTO', 'GALLERY_PHOTO', 'ID_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF', 'EDUCATION_CERTIFICATE', 'CHAT_IMAGE', 'OTHER_DOCUMENT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SCAM', 'SPAM', 'UNDERAGE', 'IMPERSONATION', 'PRIVACY_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'HI', 'CG');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "googleId" VARCHAR(255) NOT NULL,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'GOOGLE',
    "phone" VARCHAR(20),
    "countryCode" VARCHAR(5) NOT NULL DEFAULT '+91',
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profilePicture" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "preferredLanguage" "Language" NOT NULL DEFAULT 'HI',
    "agentId" INTEGER,
    "agentCodeUsed" VARCHAR(20),
    "referredAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "bannedAt" TIMESTAMP(3),
    "bannedBy" INTEGER,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" INET,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deviceInfo" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_verifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "countryCode" VARCHAR(5) NOT NULL DEFAULT '+91',
    "otpHash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" VARCHAR(255),
    "deviceName" VARCHAR(100),
    "deviceType" VARCHAR(50),
    "ipAddress" INET,
    "userAgent" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fcm_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" VARCHAR(255) NOT NULL,
    "deviceType" VARCHAR(50) NOT NULL,
    "deviceName" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "agentCode" VARCHAR(20) NOT NULL,
    "agentName" VARCHAR(200) NOT NULL,
    "contactPerson" VARCHAR(100),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "alternatePhone" VARCHAR(20),
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "postalCode" VARCHAR(20),
    "businessName" VARCHAR(200),
    "businessType" VARCHAR(50),
    "gstNumber" VARCHAR(20),
    "panNumber" VARCHAR(20),
    "commissionType" VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    "commissionValue" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "commissionOn" VARCHAR(30) NOT NULL DEFAULT 'SUBSCRIPTION',
    "tierLevel" INTEGER NOT NULL DEFAULT 1,
    "tierTarget" INTEGER,
    "tierBonus" DECIMAL(10,2),
    "totalUsersAdded" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "premiumUsers" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCommission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingCommission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidCommission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bankName" VARCHAR(100),
    "accountHolderName" VARCHAR(200),
    "accountNumber" VARCHAR(50),
    "ifscCode" VARCHAR(20),
    "branchName" VARCHAR(100),
    "upiId" VARCHAR(100),
    "idProofUrl" TEXT,
    "addressProofUrl" TEXT,
    "panCardUrl" TEXT,
    "cancelledChequeUrl" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "source" VARCHAR(50),
    "websiteUrl" VARCHAR(255),
    "socialMediaLinks" TEXT,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'HI',
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commissions" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "userId" INTEGER,
    "subscriptionId" INTEGER,
    "transactionType" VARCHAR(30) NOT NULL,
    "description" TEXT NOT NULL,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "tdsPercentage" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "tdsAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netCommission" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "payoutBatchId" INTEGER,
    "paidAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_payouts" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "payoutBatchNumber" VARCHAR(50) NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "totalCommission" DECIMAL(12,2) NOT NULL,
    "totalTds" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPayoutAmount" DECIMAL(12,2) NOT NULL,
    "bankAccountNumber" VARCHAR(50),
    "bankIfscCode" VARCHAR(20),
    "upiId" VARCHAR(100),
    "transactionId" VARCHAR(100),
    "transactionDate" TIMESTAMP(3),
    "paymentMethod" VARCHAR(30),
    "paymentStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "paymentReference" VARCHAR(100),
    "invoiceNumber" VARCHAR(50),
    "invoiceUrl" TEXT,
    "processedBy" INTEGER,
    "processedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_activity_logs" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "activityType" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileId" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200),
    "dateOfBirth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "religion" "Religion" NOT NULL,
    "caste" VARCHAR(100),
    "subCaste" VARCHAR(100),
    "motherTongue" "MotherTongue" NOT NULL,
    "gothram" VARCHAR(100),
    "nativeDistrict" VARCHAR(100),
    "nativeTehsil" VARCHAR(100),
    "nativeVillage" VARCHAR(100),
    "speaksChhattisgarhi" BOOLEAN NOT NULL DEFAULT true,
    "height" INTEGER,
    "weight" INTEGER,
    "bloodGroup" VARCHAR(5),
    "complexion" VARCHAR(30),
    "bodyType" VARCHAR(30),
    "physicalDisability" TEXT,
    "diet" VARCHAR(30),
    "smokingHabit" VARCHAR(30),
    "drinkingHabit" VARCHAR(30),
    "country" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "residencyStatus" VARCHAR(50),
    "bio" TEXT,
    "hobbies" TEXT,
    "interests" TEXT,
    "aboutFamily" TEXT,
    "partnerExpectations" TEXT,
    "fatherName" VARCHAR(100),
    "fatherOccupation" VARCHAR(100),
    "fatherStatus" VARCHAR(30),
    "motherName" VARCHAR(100),
    "motherOccupation" VARCHAR(100),
    "motherStatus" VARCHAR(30),
    "numberOfBrothers" INTEGER NOT NULL DEFAULT 0,
    "numberOfSisters" INTEGER NOT NULL DEFAULT 0,
    "brothersMarried" INTEGER NOT NULL DEFAULT 0,
    "sistersMarried" INTEGER NOT NULL DEFAULT 0,
    "familyType" VARCHAR(30),
    "familyValues" VARCHAR(30),
    "familyStatus" VARCHAR(30),
    "familyIncome" VARCHAR(50),
    "ancestralOrigin" VARCHAR(100),
    "manglik" BOOLEAN,
    "birthTime" VARCHAR(10),
    "birthPlace" VARCHAR(100),
    "rashi" VARCHAR(50),
    "nakshatra" VARCHAR(50),
    "highestEducation" VARCHAR(30),
    "educationDetails" TEXT,
    "collegeName" VARCHAR(200),
    "occupationType" VARCHAR(30),
    "occupation" VARCHAR(100),
    "designation" VARCHAR(100),
    "companyName" VARCHAR(200),
    "annualIncome" VARCHAR(50),
    "workLocation" VARCHAR(100),
    "visibility" VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
    "showContactInfo" BOOLEAN NOT NULL DEFAULT false,
    "allowPhotoRequest" BOOLEAN NOT NULL DEFAULT true,
    "showHoroscope" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "profileScore" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "contactViewCount" INTEGER NOT NULL DEFAULT 0,
    "shortlistCount" INTEGER NOT NULL DEFAULT 0,
    "matchRequestCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_preferences" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "ageFrom" INTEGER,
    "ageTo" INTEGER,
    "heightFrom" INTEGER,
    "heightTo" INTEGER,
    "religion" TEXT,
    "caste" TEXT,
    "motherTongue" TEXT,
    "maritalStatus" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "residencyStatus" TEXT,
    "nativeDistrict" TEXT,
    "mustSpeakChhattisgarhi" BOOLEAN,
    "education" TEXT,
    "occupation" TEXT,
    "annualIncome" VARCHAR(100),
    "diet" TEXT,
    "smoking" VARCHAR(30),
    "drinking" VARCHAR(30),
    "manglik" BOOLEAN,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "degree" VARCHAR(100) NOT NULL,
    "field" VARCHAR(100),
    "institution" VARCHAR(200) NOT NULL,
    "university" VARCHAR(200),
    "yearOfPassing" INTEGER,
    "grade" VARCHAR(20),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupations" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "employmentType" VARCHAR(50) NOT NULL,
    "industry" VARCHAR(100),
    "annualIncome" VARCHAR(50),
    "startDate" DATE,
    "endDate" DATE,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "location" VARCHAR(100),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER,
    "userId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mediumUrl" TEXT,
    "largeUrl" TEXT,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_requests" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" "MatchRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "responseMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_views" (
    "id" SERIAL NOT NULL,
    "viewerId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shortlistedUserId" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" SERIAL NOT NULL,
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,
    "reason" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentType" VARCHAR(50),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "nameHi" VARCHAR(100) NOT NULL,
    "nameCg" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'INR',
    "duration" INTEGER NOT NULL,
    "features" TEXT,
    "maxContactViews" INTEGER NOT NULL DEFAULT 0,
    "maxMessagesSend" INTEGER NOT NULL DEFAULT 0,
    "maxInterestsSend" INTEGER NOT NULL DEFAULT 0,
    "canSeeProfileVisitors" BOOLEAN NOT NULL DEFAULT false,
    "priorityListing" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBadge" BOOLEAN NOT NULL DEFAULT false,
    "incognitoMode" BOOLEAN NOT NULL DEFAULT false,
    "dedicatedManager" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "contactViewsUsed" INTEGER NOT NULL DEFAULT 0,
    "messagesUsed" INTEGER NOT NULL DEFAULT 0,
    "interestsUsed" INTEGER NOT NULL DEFAULT 0,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subscriptionId" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'INR',
    "transactionId" VARCHAR(255) NOT NULL,
    "paymentGateway" VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    "paymentMethod" VARCHAR(50),
    "razorpayOrderId" VARCHAR(255),
    "razorpayPaymentId" VARCHAR(255),
    "razorpaySignature" VARCHAR(255),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" VARCHAR(255),
    "receiptUrl" TEXT,
    "failureReason" TEXT,
    "refundAmount" DECIMAL(10,2),
    "refundReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "language" "Language" NOT NULL DEFAULT 'HI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "preferredLanguage" "Language" NOT NULL DEFAULT 'HI',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" VARCHAR(50),
    "entityId" INTEGER,
    "metadata" TEXT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reportedUserId" INTEGER NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "actionTaken" VARCHAR(100),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" VARCHAR(20) NOT NULL DEFAULT 'string',
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_privacy_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileVisibility" VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
    "showLastName" BOOLEAN NOT NULL DEFAULT true,
    "showExactAge" BOOLEAN NOT NULL DEFAULT false,
    "showDateOfBirth" BOOLEAN NOT NULL DEFAULT false,
    "showPhoneNumber" VARCHAR(30) NOT NULL DEFAULT 'MATCHED',
    "showEmail" VARCHAR(30) NOT NULL DEFAULT 'MATCHED',
    "showSocialMedia" VARCHAR(30) NOT NULL DEFAULT 'HIDDEN',
    "showExactLocation" BOOLEAN NOT NULL DEFAULT false,
    "showCity" BOOLEAN NOT NULL DEFAULT true,
    "showState" BOOLEAN NOT NULL DEFAULT true,
    "showCompanyName" BOOLEAN NOT NULL DEFAULT false,
    "showAnnualIncome" VARCHAR(30) NOT NULL DEFAULT 'MATCHED',
    "showWorkLocation" BOOLEAN NOT NULL DEFAULT true,
    "showFamilyDetails" VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    "showParentOccupation" BOOLEAN NOT NULL DEFAULT false,
    "showSiblingDetails" BOOLEAN NOT NULL DEFAULT true,
    "showHoroscope" BOOLEAN NOT NULL DEFAULT false,
    "showHoroscopeTo" VARCHAR(30) NOT NULL DEFAULT 'MATCHED',
    "showBirthTime" BOOLEAN NOT NULL DEFAULT false,
    "showBirthPlace" BOOLEAN NOT NULL DEFAULT false,
    "showDiet" BOOLEAN NOT NULL DEFAULT true,
    "showSmokingDrinking" VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    "showLastActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showProfileViews" BOOLEAN NOT NULL DEFAULT false,
    "showWhoViewedProfile" BOOLEAN NOT NULL DEFAULT false,
    "showShortlistedBy" BOOLEAN NOT NULL DEFAULT false,
    "showNativeDistrict" BOOLEAN NOT NULL DEFAULT true,
    "showNativeVillage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "requestType" VARCHAR(30) NOT NULL,
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_privacy_settings" (
    "id" SERIAL NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "visibility" VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    "enableWatermark" BOOLEAN NOT NULL DEFAULT true,
    "watermarkText" VARCHAR(100),
    "watermarkPosition" VARCHAR(20) NOT NULL DEFAULT 'BOTTOM_RIGHT',
    "preventScreenshots" BOOLEAN NOT NULL DEFAULT true,
    "disableRightClick" BOOLEAN NOT NULL DEFAULT true,
    "blurForNonPremium" BOOLEAN NOT NULL DEFAULT false,
    "blurLevel" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "allowViewRequests" BOOLEAN NOT NULL DEFAULT true,
    "autoApprovePremium" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_view_requests" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "photoId" INTEGER NOT NULL,
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "validUntil" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "maxViews" INTEGER NOT NULL DEFAULT 10,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_view_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "allowMatchRequestsFrom" VARCHAR(30) NOT NULL DEFAULT 'EVERYONE',
    "minAgeForRequests" INTEGER,
    "maxAgeForRequests" INTEGER,
    "allowedReligions" TEXT,
    "allowedLocations" TEXT,
    "minEducationLevel" VARCHAR(30),
    "allowMessagesFrom" VARCHAR(30) NOT NULL DEFAULT 'MATCHED_ONLY',
    "blockUnverifiedProfiles" BOOLEAN NOT NULL DEFAULT false,
    "requireMinProfileCompleteness" INTEGER NOT NULL DEFAULT 40,
    "allowAnonymousViews" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnView" BOOLEAN NOT NULL DEFAULT false,
    "blockRepeatedViews" BOOLEAN NOT NULL DEFAULT false,
    "autoResponseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoResponseMessage" TEXT,
    "sendAutoResponseToNewMatches" BOOLEAN NOT NULL DEFAULT true,
    "maxMatchRequestsPerDay" INTEGER NOT NULL DEFAULT 100,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 50,
    "preferChhattisgarhi" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_visibility_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "showInSearch" BOOLEAN NOT NULL DEFAULT true,
    "showInSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "visibleToFreeUsers" BOOLEAN NOT NULL DEFAULT true,
    "visibleToPremiumUsers" BOOLEAN NOT NULL DEFAULT true,
    "visibleToVerifiedUsers" BOOLEAN NOT NULL DEFAULT true,
    "showOnlyInCountry" BOOLEAN NOT NULL DEFAULT false,
    "showOnlyInState" BOOLEAN NOT NULL DEFAULT false,
    "showOnlyInCity" BOOLEAN NOT NULL DEFAULT false,
    "excludedCountries" TEXT,
    "showOnlyToAgeRange" BOOLEAN NOT NULL DEFAULT false,
    "visibleMinAge" INTEGER,
    "visibleMaxAge" INTEGER,
    "incognitoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hideFromSearch" BOOLEAN NOT NULL DEFAULT false,
    "hideLastActive" BOOLEAN NOT NULL DEFAULT false,
    "browseAnonymously" BOOLEAN NOT NULL DEFAULT false,
    "profilePaused" BOOLEAN NOT NULL DEFAULT false,
    "pauseReason" VARCHAR(100),
    "pausedUntil" TIMESTAMP(3),
    "showOnlyInChhattisgarh" BOOLEAN NOT NULL DEFAULT false,
    "prioritizeChhattisgarhi" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_visibility_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_privacy_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "consentToProcessData" BOOLEAN NOT NULL DEFAULT true,
    "consentToMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consentToAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "consentToThirdPartySharing" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),
    "consentIpAddress" INET,
    "dataRetentionPeriod" INTEGER NOT NULL DEFAULT 365,
    "autoDeleteAfterInactivity" BOOLEAN NOT NULL DEFAULT false,
    "inactivityPeriod" INTEGER NOT NULL DEFAULT 180,
    "allowDataForAiTraining" BOOLEAN NOT NULL DEFAULT false,
    "allowDataForResearch" BOOLEAN NOT NULL DEFAULT false,
    "allowProfileInSuccessStories" BOOLEAN NOT NULL DEFAULT true,
    "lastDataExportDate" TIMESTAMP(3),
    "dataExportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_deletion_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "deletionType" VARCHAR(30) NOT NULL,
    "reason" TEXT,
    "scheduledDeletionDate" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "canCancel" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "exportFormat" VARCHAR(10) NOT NULL DEFAULT 'JSON',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "fileSizeBytes" BIGINT,
    "expiresAt" TIMESTAMP(3),
    "downloaded" BOOLEAN NOT NULL DEFAULT false,
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_security_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorMethod" VARCHAR(20),
    "twoFactorSecret" VARCHAR(100),
    "backupCodes" TEXT,
    "requireOtpNewDevice" BOOLEAN NOT NULL DEFAULT true,
    "requireOtpNewLocation" BOOLEAN NOT NULL DEFAULT true,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 60,
    "maxActiveSessions" INTEGER NOT NULL DEFAULT 5,
    "lastPasswordChange" TIMESTAMP(3),
    "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "passwordExpiresAt" TIMESTAMP(3),
    "recoveryEmail" VARCHAR(255),
    "recoveryPhone" VARCHAR(20),
    "recoveryEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_security_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "matchRequestInApp" BOOLEAN NOT NULL DEFAULT true,
    "matchRequestSms" BOOLEAN NOT NULL DEFAULT true,
    "matchRequestEmail" BOOLEAN NOT NULL DEFAULT false,
    "matchRequestPush" BOOLEAN NOT NULL DEFAULT true,
    "matchAcceptedInApp" BOOLEAN NOT NULL DEFAULT true,
    "matchAcceptedSms" BOOLEAN NOT NULL DEFAULT true,
    "matchAcceptedEmail" BOOLEAN NOT NULL DEFAULT true,
    "matchAcceptedPush" BOOLEAN NOT NULL DEFAULT true,
    "newMessageInApp" BOOLEAN NOT NULL DEFAULT true,
    "newMessageSms" BOOLEAN NOT NULL DEFAULT false,
    "newMessageEmail" BOOLEAN NOT NULL DEFAULT false,
    "newMessagePush" BOOLEAN NOT NULL DEFAULT true,
    "profileViewInApp" BOOLEAN NOT NULL DEFAULT true,
    "profileViewEmail" BOOLEAN NOT NULL DEFAULT false,
    "shortlistedInApp" BOOLEAN NOT NULL DEFAULT true,
    "shortlistedPush" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionExpiryInApp" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionExpirySms" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionExpiryEmail" BOOLEAN NOT NULL DEFAULT true,
    "securityAlertsInApp" BOOLEAN NOT NULL DEFAULT true,
    "securityAlertsSms" BOOLEAN NOT NULL DEFAULT true,
    "securityAlertsEmail" BOOLEAN NOT NULL DEFAULT true,
    "promotionalOffersEmail" BOOLEAN NOT NULL DEFAULT false,
    "promotionalOffersSms" BOOLEAN NOT NULL DEFAULT false,
    "newsletterEmail" BOOLEAN NOT NULL DEFAULT false,
    "enableAllNotifications" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" VARCHAR(5),
    "quietHoursEnd" VARCHAR(5),
    "digestModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" VARCHAR(10) NOT NULL DEFAULT 'DAILY',
    "digestTime" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "notificationLanguage" "Language" NOT NULL DEFAULT 'HI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_agentId_idx" ON "users"("agentId");

-- CreateIndex
CREATE INDEX "users_agentCodeUsed_idx" ON "users"("agentCodeUsed");

-- CreateIndex
CREATE INDEX "users_isActive_isBanned_idx" ON "users"("isActive", "isBanned");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt" DESC);

-- CreateIndex
CREATE INDEX "users_preferredLanguage_idx" ON "users"("preferredLanguage");

-- CreateIndex
CREATE INDEX "phone_verifications_userId_idx" ON "phone_verifications"("userId");

-- CreateIndex
CREATE INDEX "phone_verifications_phone_isVerified_idx" ON "phone_verifications"("phone", "isVerified");

-- CreateIndex
CREATE INDEX "phone_verifications_expiresAt_idx" ON "phone_verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_isRevoked_idx" ON "refresh_tokens"("isRevoked");

-- CreateIndex
CREATE INDEX "fcm_tokens_userId_isActive_idx" ON "fcm_tokens"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "fcm_tokens_userId_deviceId_key" ON "fcm_tokens"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_agentCode_key" ON "agents"("agentCode");

-- CreateIndex
CREATE INDEX "agents_agentCode_idx" ON "agents"("agentCode");

-- CreateIndex
CREATE INDEX "agents_status_isActive_idx" ON "agents"("status", "isActive");

-- CreateIndex
CREATE INDEX "agents_email_idx" ON "agents"("email");

-- CreateIndex
CREATE INDEX "agents_phone_idx" ON "agents"("phone");

-- CreateIndex
CREATE INDEX "agents_district_idx" ON "agents"("district");

-- CreateIndex
CREATE INDEX "agents_createdAt_idx" ON "agents"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "agents_totalUsersAdded_idx" ON "agents"("totalUsersAdded" DESC);

-- CreateIndex
CREATE INDEX "agent_commissions_agentId_status_idx" ON "agent_commissions"("agentId", "status");

-- CreateIndex
CREATE INDEX "agent_commissions_userId_idx" ON "agent_commissions"("userId");

-- CreateIndex
CREATE INDEX "agent_commissions_status_createdAt_idx" ON "agent_commissions"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "agent_payouts_payoutBatchNumber_key" ON "agent_payouts"("payoutBatchNumber");

-- CreateIndex
CREATE INDEX "agent_payouts_agentId_idx" ON "agent_payouts"("agentId");

-- CreateIndex
CREATE INDEX "agent_payouts_payoutBatchNumber_idx" ON "agent_payouts"("payoutBatchNumber");

-- CreateIndex
CREATE INDEX "agent_payouts_paymentStatus_idx" ON "agent_payouts"("paymentStatus");

-- CreateIndex
CREATE INDEX "agent_payouts_createdAt_idx" ON "agent_payouts"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "agent_activity_logs_agentId_idx" ON "agent_activity_logs"("agentId");

-- CreateIndex
CREATE INDEX "agent_activity_logs_activityType_idx" ON "agent_activity_logs"("activityType");

-- CreateIndex
CREATE INDEX "agent_activity_logs_createdAt_idx" ON "agent_activity_logs"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_profileId_key" ON "profiles"("profileId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_profileId_idx" ON "profiles"("profileId");

-- CreateIndex
CREATE INDEX "profiles_gender_dateOfBirth_idx" ON "profiles"("gender", "dateOfBirth");

-- CreateIndex
CREATE INDEX "profiles_religion_caste_idx" ON "profiles"("religion", "caste");

-- CreateIndex
CREATE INDEX "profiles_city_state_country_idx" ON "profiles"("city", "state", "country");

-- CreateIndex
CREATE INDEX "profiles_maritalStatus_idx" ON "profiles"("maritalStatus");

-- CreateIndex
CREATE INDEX "profiles_isVerified_isPublished_idx" ON "profiles"("isVerified", "isPublished");

-- CreateIndex
CREATE INDEX "profiles_profileCompleteness_idx" ON "profiles"("profileCompleteness" DESC);

-- CreateIndex
CREATE INDEX "profiles_nativeDistrict_idx" ON "profiles"("nativeDistrict");

-- CreateIndex
CREATE INDEX "profiles_speaksChhattisgarhi_idx" ON "profiles"("speaksChhattisgarhi");

-- CreateIndex
CREATE UNIQUE INDEX "partner_preferences_profileId_key" ON "partner_preferences"("profileId");

-- CreateIndex
CREATE INDEX "education_profileId_idx" ON "education"("profileId");

-- CreateIndex
CREATE INDEX "occupations_profileId_idx" ON "occupations"("profileId");

-- CreateIndex
CREATE INDEX "media_profileId_idx" ON "media"("profileId");

-- CreateIndex
CREATE INDEX "media_userId_idx" ON "media"("userId");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_verificationStatus_idx" ON "media"("verificationStatus");

-- CreateIndex
CREATE INDEX "match_requests_senderId_status_idx" ON "match_requests"("senderId", "status");

-- CreateIndex
CREATE INDEX "match_requests_receiverId_status_idx" ON "match_requests"("receiverId", "status");

-- CreateIndex
CREATE INDEX "match_requests_status_idx" ON "match_requests"("status");

-- CreateIndex
CREATE INDEX "match_requests_expiresAt_idx" ON "match_requests"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "match_requests_senderId_receiverId_key" ON "match_requests"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "profile_views_viewerId_idx" ON "profile_views"("viewerId");

-- CreateIndex
CREATE INDEX "profile_views_profileId_viewedAt_idx" ON "profile_views"("profileId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "shortlists_userId_idx" ON "shortlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shortlists_userId_shortlistedUserId_key" ON "shortlists"("userId", "shortlistedUserId");

-- CreateIndex
CREATE INDEX "blocked_users_blockerId_idx" ON "blocked_users"("blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_users_blockerId_blockedId_key" ON "blocked_users"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "messages_senderId_receiverId_idx" ON "messages"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "messages_receiverId_isRead_idx" ON "messages"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_status_idx" ON "user_subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "user_subscriptions_endDate_idx" ON "user_subscriptions"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admin_activity_logs_adminId_idx" ON "admin_activity_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_activity_logs_createdAt_idx" ON "admin_activity_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "reports_reportedUserId_status_idx" ON "reports"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "profile_privacy_settings_userId_key" ON "profile_privacy_settings"("userId");

-- CreateIndex
CREATE INDEX "contact_requests_profileId_status_idx" ON "contact_requests"("profileId", "status");

-- CreateIndex
CREATE INDEX "contact_requests_requesterId_idx" ON "contact_requests"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_requests_requesterId_profileId_requestType_status_key" ON "contact_requests"("requesterId", "profileId", "requestType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "photo_privacy_settings_mediaId_key" ON "photo_privacy_settings"("mediaId");

-- CreateIndex
CREATE INDEX "photo_view_requests_profileId_status_idx" ON "photo_view_requests"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "photo_view_requests_requesterId_photoId_status_key" ON "photo_view_requests"("requesterId", "photoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "communication_preferences_userId_key" ON "communication_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "search_visibility_settings_userId_key" ON "search_visibility_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "data_privacy_settings_userId_key" ON "data_privacy_settings"("userId");

-- CreateIndex
CREATE INDEX "data_deletion_requests_userId_idx" ON "data_deletion_requests"("userId");

-- CreateIndex
CREATE INDEX "data_deletion_requests_status_scheduledDeletionDate_idx" ON "data_deletion_requests"("status", "scheduledDeletionDate");

-- CreateIndex
CREATE INDEX "data_export_requests_userId_idx" ON "data_export_requests"("userId");

-- CreateIndex
CREATE INDEX "data_export_requests_status_idx" ON "data_export_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "account_security_settings_userId_key" ON "account_security_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_verifications" ADD CONSTRAINT "phone_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "agent_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_payouts" ADD CONSTRAINT "agent_payouts_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_activity_logs" ADD CONSTRAINT "agent_activity_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupations" ADD CONSTRAINT "occupations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_requests" ADD CONSTRAINT "match_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_requests" ADD CONSTRAINT "match_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_shortlistedUserId_fkey" FOREIGN KEY ("shortlistedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_privacy_settings" ADD CONSTRAINT "photo_privacy_settings_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_privacy_settings" ADD CONSTRAINT "photo_privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_view_requests" ADD CONSTRAINT "photo_view_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_view_requests" ADD CONSTRAINT "photo_view_requests_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_view_requests" ADD CONSTRAINT "photo_view_requests_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_visibility_settings" ADD CONSTRAINT "search_visibility_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_privacy_settings" ADD CONSTRAINT "data_privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_security_settings" ADD CONSTRAINT "account_security_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
