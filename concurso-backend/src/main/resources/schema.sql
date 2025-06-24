mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: mpd_concursos
-- ------------------------------------------------------
-- Server version	8.0.42

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

DROP TABLE IF EXISTS `answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answers` (
  `id` binary(16) NOT NULL,
  `question_id` binary(16) DEFAULT NULL,
  `response` text,
  `response_time_ms` bigint DEFAULT NULL,
  `status` enum('DRAFT','SUBMITTED','VALIDATED','INVALIDATED','SUSPICIOUS') DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `session_id` binary(16) DEFAULT NULL,
  `attempts` int DEFAULT NULL,
  `hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`),
  CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `examination_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `timestamp` datetime(6) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `outcome` varchar(500) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `event_type` enum('USER_CREATED','USER_UPDATED','USER_DELETED','STATUS_CHANGED','ROLES_CHANGED','PROFILE_UPDATED','LOGIN_SUCCESS','LOGIN_FAILURE','LOGOUT_SUCCESS','PASSWORD_CHANGED','PASSWORD_RESET_REQUEST','PASSWORD_RESET_SUCCESS','ACCOUNT_LOCKED','ACCOUNT_UNLOCKED','PERMISSIONS_DENIED','SYSTEM_STARTUP','SYSTEM_SHUTDOWN','CONFIG_CHANGED') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_dates`
--

DROP TABLE IF EXISTS `contest_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_dates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contest_id` bigint NOT NULL,
  `label` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contest_id` (`contest_id`),
  CONSTRAINT `contest_dates_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_documents`
--

DROP TABLE IF EXISTS `contest_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_documents` (
  `id` binary(16) NOT NULL,
  `contest_id` bigint DEFAULT NULL,
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
  KEY `contest_id` (`contest_id`),
  KEY `uploadedBy` (`uploadedBy`),
  CONSTRAINT `contest_documents_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`),
  CONSTRAINT `contest_documents_ibfk_2` FOREIGN KEY (`uploadedBy`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_requirements`
--

DROP TABLE IF EXISTS `contest_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_requirements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contest_id` bigint NOT NULL,
  `description` varchar(500) NOT NULL,
  `category` varchar(100) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '1',
  `priority` int NOT NULL DEFAULT '1',
  `document_type` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contest_requirements_contest_id` (`contest_id`),
  KEY `idx_contest_requirements_category` (`category`),
  KEY `idx_contest_requirements_priority` (`priority`),
  CONSTRAINT `contest_requirements_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contests`
--

DROP TABLE IF EXISTS `contests`;
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
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `bases_url` varchar(255) DEFAULT NULL,
  `description_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `check_dates` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` binary(16) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `order` int DEFAULT NULL,
  `parent_id` binary(16) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `document_types_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `document_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `document_type_id` binary(16) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `content_type` varchar(100) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `comments` text,
  `upload_date` datetime NOT NULL,
  `validated_by` binary(16) DEFAULT NULL,
  `validated_at` datetime DEFAULT NULL,
  `rejection_reason` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `document_type_id` (`document_type_id`),
  KEY `validated_by` (`validated_by`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`),
  CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`validated_by`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `education`
--

DROP TABLE IF EXISTS `education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education` (
  `id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `type` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `document_url` varchar(500) DEFAULT NULL,
  `duration_years` int DEFAULT NULL,
  `average` double DEFAULT NULL,
  `thesis_topic` varchar(255) DEFAULT NULL,
  `hourly_load` int DEFAULT NULL,
  `had_final_evaluation` tinyint(1) DEFAULT NULL,
  `activity_type` varchar(50) DEFAULT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `activity_role` varchar(100) DEFAULT NULL,
  `exposition_place_date` varchar(255) DEFAULT NULL,
  `comments` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `education_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `education_record`
--

DROP TABLE IF EXISTS `education_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education_record` (
  `credit_hours` int DEFAULT NULL,
  `duration_hours` int DEFAULT NULL,
  `duration_years` int DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `final_grade` decimal(4,2) DEFAULT NULL,
  `graduation_date` date DEFAULT NULL,
  `is_ongoing` bit(1) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `presentation_date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `id` binary(16) NOT NULL,
  `updated_by` binary(16) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  `grade_scale` varchar(50) DEFAULT NULL,
  `activity_role` varchar(100) DEFAULT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `certification_number` varchar(100) DEFAULT NULL,
  `supporting_document_url` varchar(500) DEFAULT NULL,
  `thesis_title` varchar(500) DEFAULT NULL,
  `academic_honors` varchar(255) DEFAULT NULL,
  `comments` text,
  `field_of_study` varchar(255) DEFAULT NULL,
  `institution_name` varchar(255) NOT NULL,
  `issuing_authority` varchar(255) DEFAULT NULL,
  `presentation_location` varchar(255) DEFAULT NULL,
  `program_title` varchar(255) NOT NULL,
  `thesis_advisor` varchar(255) DEFAULT NULL,
  `thesis_topic` text,
  `verification_notes` text,
  `education_status` enum('IN_PROGRESS','COMPLETED','SUSPENDED','ABANDONED') NOT NULL,
  `education_type` enum('PRIMARY_EDUCATION','SECONDARY_EDUCATION','TECHNICAL_DEGREE','UNIVERSITY_DEGREE','POSTGRADUATE_DEGREE','MASTER_DEGREE','DOCTORAL_DEGREE','CERTIFICATION','DIPLOMA','TRAINING_COURSE','SCIENTIFIC_ACTIVITY') NOT NULL,
  `verification_status` enum('PENDING','VERIFIED','REJECTED') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK56boiyr2qcdqtirx6gb71hisx` (`created_by`),
  KEY `FK89rv0x1og9863b5d9dw1jssdk` (`updated_by`),
  KEY `FKh1rqt7rnc0fti9ovjyjj5jr4u` (`user_id`),
  CONSTRAINT `FK56boiyr2qcdqtirx6gb71hisx` FOREIGN KEY (`created_by`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `FK89rv0x1og9863b5d9dw1jssdk` FOREIGN KEY (`updated_by`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `FKh1rqt7rnc0fti9ovjyjj5jr4u` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_allowed_materials`
--

DROP TABLE IF EXISTS `examination_allowed_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_allowed_materials` (
  `examination_id` binary(16) NOT NULL,
  `material` text NOT NULL,
  KEY `examination_id` (`examination_id`),
  CONSTRAINT `examination_allowed_materials_ibfk_1` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_requirements`
--

DROP TABLE IF EXISTS `examination_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_requirements` (
  `examination_id` binary(16) NOT NULL,
  `requirement` text NOT NULL,
  KEY `examination_id` (`examination_id`),
  CONSTRAINT `examination_requirements_ibfk_1` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_rules`
--

DROP TABLE IF EXISTS `examination_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_rules` (
  `examination_id` binary(16) NOT NULL,
  `rule` text NOT NULL,
  KEY `examination_id` (`examination_id`),
  CONSTRAINT `examination_rules_ibfk_1` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_security_violations`
--

DROP TABLE IF EXISTS `examination_security_violations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_security_violations` (
  `examination_id` binary(16) NOT NULL,
  `violation` varchar(255) NOT NULL,
  KEY `examination_id` (`examination_id`),
  CONSTRAINT `examination_security_violations_ibfk_1` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examination_sessions`
--

DROP TABLE IF EXISTS `examination_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_sessions` (
  `id` binary(16) NOT NULL,
  `examination_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `deadline` datetime(6) DEFAULT NULL,
  `status` enum('CREATED','IN_PROGRESS','PAUSED','FINISHED','INVALIDATED') NOT NULL,
  `current_question_index` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `examination_id` (`examination_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `examination_sessions_ibfk_1` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`),
  CONSTRAINT `examination_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examinations`
--

DROP TABLE IF EXISTS `examinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examinations` (
  `id` binary(16) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `duration_minutes` bigint DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED') NOT NULL,
  `type` enum('TECHNICAL_LEGAL','TECHNICAL_ADMINISTRATIVE','PSYCHOLOGICAL') NOT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `answers` text,
  `cancellation_date` datetime(6) DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experience`
--

DROP TABLE IF EXISTS `experience`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience` (
  `id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `company` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `description` text,
  `comments` text,
  `document_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_experience_user_id` (`user_id`),
  CONSTRAINT `fk_experience_user` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experiencia`
--

DROP TABLE IF EXISTS `experiencia`;
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
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_experiencia_user_id` (`user_id`),
  CONSTRAINT `fk_experiencia_user` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experiencias`
--

DROP TABLE IF EXISTS `experiencias`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscription_circunscripciones`
--

DROP TABLE IF EXISTS `inscription_circunscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_circunscripciones` (
  `inscriptionId` binary(16) NOT NULL,
  `circunscripcion` varchar(100) NOT NULL,
  PRIMARY KEY (`inscriptionId`,`circunscripcion`),
  CONSTRAINT `inscription_circunscripciones_ibfk_1` FOREIGN KEY (`inscriptionId`) REFERENCES `inscriptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscription_notes`
--

DROP TABLE IF EXISTS `inscription_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_notes` (
  `id` binary(16) NOT NULL,
  `inscription_id` binary(16) NOT NULL,
  `text` varchar(1000) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `created_by_username` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `inscription_id` (`inscription_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `inscription_notes_ibfk_1` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions` (`id`),
  CONSTRAINT `inscription_notes_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscription_sessions`
--

DROP TABLE IF EXISTS `inscription_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_sessions` (
  `id` binary(16) NOT NULL,
  `inscription_id` binary(16) NOT NULL,
  `contest_id` bigint NOT NULL,
  `user_id` binary(16) NOT NULL,
  `current_step` enum('INITIAL','TERMS_ACCEPTANCE','LOCATION_SELECTION','DOCUMENTATION','DATA_CONFIRMATION','COMPLETED') NOT NULL,
  `form_data` longtext NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `inscription_id` (`inscription_id`),
  KEY `contest_id` (`contest_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `inscription_sessions_ibfk_1` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscription_sessions_ibfk_2` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`),
  CONSTRAINT `inscription_sessions_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscriptions`
--

DROP TABLE IF EXISTS `inscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscriptions` (
  `id` binary(16) NOT NULL,
  `contest_id` bigint DEFAULT NULL,
  `user_id` binary(16) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `inscription_date` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','PENDING','COMPLETED_WITH_DOCS','COMPLETED_PENDING_DOCS','FROZEN','APPROVED','REJECTED','CANCELLED') DEFAULT NULL,
  `current_step` enum('INITIAL','TERMS_ACCEPTANCE','LOCATION_SELECTION','DOCUMENTATION','DATA_CONFIRMATION','COMPLETED') DEFAULT NULL,
  `accepted_terms` tinyint(1) DEFAULT '0',
  `confirmed_personal_data` tinyint(1) DEFAULT '0',
  `documentos_completos` tinyint(1) DEFAULT '0',
  `centro_de_vida` varchar(500) DEFAULT NULL,
  `terms_acceptance_date` datetime(6) DEFAULT NULL,
  `data_confirmation_date` datetime(6) DEFAULT NULL,
  `documentation_deadline` datetime(6) DEFAULT NULL,
  `frozen_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contest_id` (`contest_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `inscriptions_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`),
  CONSTRAINT `inscriptions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `id` binary(16) NOT NULL,
  `text` text,
  `order_number` int DEFAULT NULL,
  `question_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_correct_answers`
--

DROP TABLE IF EXISTS `question_correct_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_correct_answers` (
  `question_entity_id` binary(16) NOT NULL,
  `correct_answers` varchar(255) DEFAULT NULL,
  KEY `question_entity_id` (`question_entity_id`),
  CONSTRAINT `question_correct_answers_ibfk_1` FOREIGN KEY (`question_entity_id`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` binary(16) NOT NULL,
  `examination_id` binary(16) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `type` enum('MULTIPLE_CHOICE','SINGLE_CHOICE','TEXT','TRUE_FALSE') NOT NULL,
  `score` int DEFAULT NULL,
  `order_number` int DEFAULT NULL,
  `correct_answer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `examination_id` (`examination_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` binary(16) NOT NULL,
  `name` enum('ROLE_USER','ROLE_ADMIN') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_entity`
--

DROP TABLE IF EXISTS `user_entity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_entity` (
  `id` binary(16) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `dni` varchar(255) NOT NULL,
  `cuit` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `municipality` varchar(255) DEFAULT NULL,
  `legal_address` varchar(255) DEFAULT NULL,
  `residential_address` varchar(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('ACTIVE','INACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `version` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `cuit` (`cuit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` binary(16) NOT NULL,
  `role_id` binary(16) NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_experience`
--

DROP TABLE IF EXISTS `work_experience`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_experience` (
  `end_date` date DEFAULT NULL,
  `is_current_position` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `start_date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `deleted_by` binary(16) DEFAULT NULL,
  `id` binary(16) NOT NULL,
  `updated_by` binary(16) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  `supporting_document_url` varchar(500) DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `job_description` text,
  `key_achievements` text,
  `location` varchar(255) DEFAULT NULL,
  `position_title` varchar(255) NOT NULL,
  `technologies_used` text,
  `verification_notes` text,
  `verification_status` enum('PENDING','VERIFIED','REJECTED') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsoko8tglxtlkxar3yh79pwtq5` (`created_by`),
  KEY `FKieyywgegnjb35gmm9bxk2i13b` (`deleted_by`),
  KEY `FKhrp2e1e6klwk82erhfi9glxj1` (`updated_by`),
  KEY `FK2e1iydswcvp74ofqv0psmhgej` (`user_id`),
  CONSTRAINT `FK2e1iydswcvp74ofqv0psmhgej` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `FKhrp2e1e6klwk82erhfi9glxj1` FOREIGN KEY (`updated_by`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `FKieyywgegnjb35gmm9bxk2i13b` FOREIGN KEY (`deleted_by`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `FKsoko8tglxtlkxar3yh79pwtq5` FOREIGN KEY (`created_by`) REFERENCES `user_entity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-24 21:57:56
