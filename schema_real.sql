-- MySQL dump 10.13  Distrib 8.4.4, for Win64 (x86_64)
--
-- Host: localhost    Database: mpd_concursos
-- ------------------------------------------------------
-- Server version	8.4.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `answers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answers` (
  `id` binary(16) NOT NULL,
  `questionId` binary(16) DEFAULT NULL,
  `response` text,
  `responseTimeMs` bigint DEFAULT NULL,
  `status` enum('DRAFT','SUBMITTED','VALIDATED','INVALIDATED','SUSPICIOUS') DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `sessionId` binary(16) DEFAULT NULL,
  `attempts` int DEFAULT NULL,
  `hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `questionId` (`questionId`),
  KEY `sessionId` (`sessionId`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`),
  CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`sessionId`) REFERENCES `examination_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_dates`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_dates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contestId` bigint NOT NULL,
  `label` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contestId` (`contestId`),
  CONSTRAINT `contest_dates_ibfk_1` FOREIGN KEY (`contestId`) REFERENCES `contests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_documents`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_documents` (
  `id` binary(16) NOT NULL,
  `contestId` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `fileUrl` varchar(500) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `fileType` varchar(100) DEFAULT NULL,
  `fileSize` bigint DEFAULT NULL,
  `required` tinyint(1) DEFAULT '0',
  `public` tinyint(1) DEFAULT '0',
  `uploadedBy` binary(16) DEFAULT NULL,
  `uploadedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contestId` (`contestId`),
  KEY `uploadedBy` (`uploadedBy`),
  CONSTRAINT `contest_documents_ibfk_1` FOREIGN KEY (`contestId`) REFERENCES `contests` (`id`),
  CONSTRAINT `contest_documents_ibfk_2` FOREIGN KEY (`uploadedBy`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_requirements`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_requirements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contestId` bigint NOT NULL,
  `description` varchar(500) NOT NULL,
  `category` varchar(100) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '1',
  `priority` int NOT NULL DEFAULT '1',
  `documentType` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contest_requirements_contest_id` (`contestId`),
  KEY `idx_contest_requirements_category` (`category`),
  KEY `idx_contest_requirements_priority` (`priority`),
  CONSTRAINT `contest_requirements_ibfk_1` FOREIGN KEY (`contestId`) REFERENCES `contests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contests`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `class_` varchar(255) DEFAULT NULL,
  `functions` text,
  `department` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `status` enum('DRAFT','PUBLISHED','PAUSED','CANCELLED','FINISHED','ARCHIVED','INSCRIPTION_PENDING','INSCRIPTION_OPEN','INSCRIPTION_CLOSED','IN_EVALUATION','RESULTS_PUBLISHED') NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `basesUrl` varchar(255) DEFAULT NULL,
  `descriptionUrl` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `check_dates` CHECK ((`endDate` >= `startDate`))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document_types`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` binary(16) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `order` int DEFAULT NULL,
  `parentId` binary(16) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parentId` (`parentId`),
  CONSTRAINT `document_types_ibfk_1` FOREIGN KEY (`parentId`) REFERENCES `document_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documents`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `documentTypeId` binary(16) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `contentType` varchar(100) NOT NULL,
  `filePath` varchar(500) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `comments` text,
  `uploadDate` datetime NOT NULL,
  `validatedBy` binary(16) DEFAULT NULL,
  `validatedAt` datetime DEFAULT NULL,
  `rejectionReason` text,
  `version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `documentTypeId` (`documentTypeId`),
  KEY `validatedBy` (`validatedBy`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`documentTypeId`) REFERENCES `document_types` (`id`),
  CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`validatedBy`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `education`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education` (
  `id` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `type` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `issueDate` date DEFAULT NULL,
  `documentUrl` varchar(500) DEFAULT NULL,
  `durationYears` int DEFAULT NULL,
  `average` double DEFAULT NULL,
  `thesisTopic` varchar(255) DEFAULT NULL,
  `hourlyLoad` int DEFAULT NULL,
  `hadFinalEvaluation` tinyint(1) DEFAULT NULL,
  `activityType` varchar(50) DEFAULT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `activityRole` varchar(100) DEFAULT NULL,
  `expositionPlaceDate` varchar(255) DEFAULT NULL,
  `comments` text,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `education_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_allowed_materials`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_allowed_materials` (
  `examinationId` binary(16) NOT NULL,
  `material` text NOT NULL,
  KEY `examinationId` (`examinationId`),
  CONSTRAINT `examination_allowed_materials_ibfk_1` FOREIGN KEY (`examinationId`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_requirements`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_requirements` (
  `examinationId` binary(16) NOT NULL,
  `requirement` text NOT NULL,
  KEY `examinationId` (`examinationId`),
  CONSTRAINT `examination_requirements_ibfk_1` FOREIGN KEY (`examinationId`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_rules`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_rules` (
  `examinationId` binary(16) NOT NULL,
  `rule` text NOT NULL,
  KEY `examinationId` (`examinationId`),
  CONSTRAINT `examination_rules_ibfk_1` FOREIGN KEY (`examinationId`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_security_violations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_security_violations` (
  `examinationId` binary(16) NOT NULL,
  `violation` varchar(255) NOT NULL,
  KEY `examinationId` (`examinationId`),
  CONSTRAINT `examination_security_violations_ibfk_1` FOREIGN KEY (`examinationId`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_sessions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_sessions` (
  `id` binary(16) NOT NULL,
  `examinationId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `startTime` datetime(6) DEFAULT NULL,
  `deadline` datetime(6) DEFAULT NULL,
  `status` enum('CREATED','IN_PROGRESS','PAUSED','FINISHED','INVALIDATED') NOT NULL,
  `currentQuestionIndex` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `examinationId` (`examinationId`),
  KEY `userId` (`userId`),
  CONSTRAINT `examination_sessions_ibfk_1` FOREIGN KEY (`examinationId`) REFERENCES `examinations` (`id`),
  CONSTRAINT `examination_sessions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examinations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examinations` (
  `id` binary(16) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `durationMinutes` bigint DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED') NOT NULL,
  `type` enum('TECHNICAL_LEGAL','TECHNICAL_ADMINISTRATIVE','PSYCHOLOGICAL') NOT NULL,
  `startTime` datetime(6) DEFAULT NULL,
  `endTime` datetime(6) DEFAULT NULL,
  `answers` text,
  `cancellationDate` datetime(6) DEFAULT NULL,
  `cancellationReason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experience`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience` (
  `id` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `company` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `description` text,
  `comments` text,
  `documentUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_experience_user_id` (`userId`),
  CONSTRAINT `fk_experience_user` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experiencia`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experiencia` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `empresa` varchar(255) NOT NULL,
  `cargo` varchar(255) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date DEFAULT NULL,
  `descripcion` text,
  `comentario` text,
  `userId` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_experiencia_user_id` (`userId`),
  CONSTRAINT `fk_experiencia_user` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experiencias`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experiencias` (
  `id` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `empresa` varchar(255) NOT NULL,
  `cargo` varchar(255) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date DEFAULT NULL,
  `descripcion` text,
  `comentario` text,
  `documentUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_experiencias_user_id` (`userId`),
  CONSTRAINT `fk_experiencias_user` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscription_circunscripciones`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_circunscripciones` (
  `inscriptionId` binary(16) NOT NULL,
  `circunscripcion` varchar(100) NOT NULL,
  PRIMARY KEY (`inscriptionId`,`circunscripcion`),
  CONSTRAINT `inscription_circunscripciones_ibfk_1` FOREIGN KEY (`inscriptionId`) REFERENCES `inscriptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscription_notes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_notes` (
  `id` binary(16) NOT NULL,
  `inscriptionId` binary(16) NOT NULL,
  `text` varchar(1000) NOT NULL,
  `createdAt` datetime(6) NOT NULL,
  `createdBy` binary(16) DEFAULT NULL,
  `createdByUsername` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `inscriptionId` (`inscriptionId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `inscription_notes_ibfk_1` FOREIGN KEY (`inscriptionId`) REFERENCES `inscriptions` (`id`),
  CONSTRAINT `inscription_notes_ibfk_2` FOREIGN KEY (`createdBy`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscription_sessions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_sessions` (
  `id` binary(16) NOT NULL,
  `inscriptionId` binary(16) NOT NULL,
  `contestId` bigint NOT NULL,
  `userId` binary(16) NOT NULL,
  `currentStep` enum('INITIAL','TERMS_ACCEPTANCE','LOCATION_SELECTION','DOCUMENTATION','DATA_CONFIRMATION','COMPLETED') NOT NULL,
  `formData` longtext NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `expiresAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `inscriptionId` (`inscriptionId`),
  KEY `contestId` (`contestId`),
  KEY `userId` (`userId`),
  CONSTRAINT `inscription_sessions_ibfk_1` FOREIGN KEY (`inscriptionId`) REFERENCES `inscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscription_sessions_ibfk_2` FOREIGN KEY (`contestId`) REFERENCES `contests` (`id`),
  CONSTRAINT `inscription_sessions_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscriptions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscriptions` (
  `id` binary(16) NOT NULL,
  `contestId` bigint DEFAULT NULL,
  `userId` binary(16) DEFAULT NULL,
  `createdAt` datetime(6) DEFAULT NULL,
  `updatedAt` datetime(6) DEFAULT NULL,
  `inscriptionDate` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','PENDING','COMPLETED_WITH_DOCS','COMPLETED_PENDING_DOCS','FROZEN','APPROVED','REJECTED','CANCELLED') DEFAULT NULL,
  `currentStep` enum('INITIAL','TERMS_ACCEPTANCE','LOCATION_SELECTION','DOCUMENTATION','DATA_CONFIRMATION','COMPLETED') DEFAULT NULL,
  `acceptedTerms` tinyint(1) DEFAULT '0',
  `confirmedPersonalData` tinyint(1) DEFAULT '0',
  `documentosCompletos` tinyint(1) DEFAULT '0',
  `centroDeVida` varchar(500) DEFAULT NULL,
  `termsAcceptanceDate` datetime(6) DEFAULT NULL,
  `dataConfirmationDate` datetime(6) DEFAULT NULL,
  `documentationDeadline` datetime(6) DEFAULT NULL,
  `frozenDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contestId` (`contestId`),
  KEY `userId` (`userId`),
  CONSTRAINT `inscriptions_ibfk_1` FOREIGN KEY (`contestId`) REFERENCES `contests` (`id`),
  CONSTRAINT `inscriptions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` binary(16) NOT NULL,
  `recipient_id` binary(16) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `status` enum('PENDING','SENT','READ','ACKNOWLEDGED') NOT NULL,
  `sent_at` datetime(6) NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `acknowledged_at` datetime(6) DEFAULT NULL,
  `acknowledgement_level` enum('NONE','SIMPLE','SIGNATURE_BASIC','SIGNATURE_ADVANCED') NOT NULL,
  `signature_type` enum('PIN','BIOMETRIC','DIGITAL_CERT','DECLARATION') DEFAULT NULL,
  `signature_value` varchar(255) DEFAULT NULL,
  `signature_metadata` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `type` enum('INSCRIPTION','SYSTEM','CONTEST','GENERAL') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recipient_id` (`recipient_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`recipient_id`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `options`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `id` binary(16) NOT NULL,
  `text` text,
  `orderNumber` int DEFAULT NULL,
  `questionId` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `questionId` (`questionId`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_correct_answers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_correct_answers` (
  `questionEntityId` binary(16) NOT NULL,
  `correctAnswers` varchar(255) DEFAULT NULL,
  KEY `questionEntityId` (`questionEntityId`),
  CONSTRAINT `question_correct_answers_ibfk_1` FOREIGN KEY (`questionEntityId`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` binary(16) NOT NULL,
  `examinationId` binary(16) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `type` enum('MULTIPLE_CHOICE','SINGLE_CHOICE','TEXT','TRUE_FALSE') NOT NULL,
  `score` int DEFAULT NULL,
  `orderNumber` int DEFAULT NULL,
  `correctAnswer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `examinationId` (`examinationId`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`examinationId`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` binary(16) NOT NULL,
  `name` enum('ROLE_USER','ROLE_ADMIN') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_entity`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_entity` (
  `id` binary(16) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `dni` varchar(255) NOT NULL,
  `cuit` varchar(255) DEFAULT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `birthDate` date DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `municipality` varchar(255) DEFAULT NULL,
  `legalAddress` varchar(255) DEFAULT NULL,
  `residentialAddress` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('ACTIVE','INACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `cuit` (`cuit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `userId` binary(16) NOT NULL,
  `roleId` binary(16) NOT NULL,
  PRIMARY KEY (`userId`,`roleId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-12 20:02:29
