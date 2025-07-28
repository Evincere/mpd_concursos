-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: mpd_concursos
-- ------------------------------------------------------
-- Server version	8.0.43

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
  `attempts` int DEFAULT NULL,
  `hash` varchar(255) DEFAULT NULL,
  `question_id` binary(16) DEFAULT NULL,
  `response` text,
  `response_time_ms` bigint DEFAULT NULL,
  `status` enum('DRAFT','INVALIDATED','SUBMITTED','SUSPICIOUS','VALIDATED') DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `session_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKosmkkphkqwn4a1r8xkrbv3xcu` (`session_id`),
  CONSTRAINT `FKosmkkphkqwn4a1r8xkrbv3xcu` FOREIGN KEY (`session_id`) REFERENCES `examination_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answers`
--

LOCK TABLES `answers` WRITE;
/*!40000 ALTER TABLE `answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` varchar(1000) DEFAULT NULL,
  `event_type` enum('ACCOUNT_LOCKED','ACCOUNT_UNLOCKED','CONFIG_CHANGED','LOGIN_FAILURE','LOGIN_SUCCESS','LOGOUT_SUCCESS','PASSWORD_CHANGED','PASSWORD_RESET_REQUEST','PASSWORD_RESET_SUCCESS','PERMISSIONS_DENIED','PROFILE_UPDATED','ROLES_CHANGED','STATUS_CHANGED','SYSTEM_SHUTDOWN','SYSTEM_STARTUP','USER_CREATED','USER_DELETED','USER_UPDATED') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `outcome` varchar(500) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `timestamp` datetime(6) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest_dates`
--

DROP TABLE IF EXISTS `contest_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_dates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `end_date` date DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `contest_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK27nd17cg91bx0w6dx18hp2s6f` (`contest_id`),
  CONSTRAINT `FK27nd17cg91bx0w6dx18hp2s6f` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest_dates`
--

LOCK TABLES `contest_dates` WRITE;
/*!40000 ALTER TABLE `contest_dates` DISABLE KEYS */;
INSERT INTO `contest_dates` VALUES (1,'2025-08-23','Per√≠odo de Inscripci√≥n','2025-07-24','inscription',1),(2,'2025-09-02','Evaluaci√≥n de Antecedentes','2025-08-28','evaluation',1),(3,'2025-09-07','Examen Escrito','2025-09-07','written_exam',1),(4,'2025-09-12','Entrevista Personal','2025-09-12','interview',1),(5,'2025-09-17','Publicaci√≥n de Resultados','2025-09-17','results',1),(6,'2025-08-23','Per√≠odo de Inscripci√≥n','2025-07-24','inscription',2),(7,'2025-09-02','Evaluaci√≥n de Antecedentes','2025-08-28','evaluation',2),(8,'2025-09-07','Examen Escrito','2025-09-07','written_exam',2),(9,'2025-09-12','Entrevista Personal','2025-09-12','interview',2),(10,'2025-09-17','Publicaci√≥n de Resultados','2025-09-17','results',2),(16,'2025-07-09','Per√≠odo de Inscripci√≥n (CERRADO)','2025-06-09','inscription',4),(17,'2025-07-19','Evaluaci√≥n de Antecedentes (FINALIZADA)','2025-07-14','evaluation',4),(18,'2025-07-21','Examen Escrito (FINALIZADO)','2025-07-21','written_exam',4),(19,'2025-07-29','Entrevista Personal (PR√ìXIMAMENTE)','2025-07-29','interview',4),(20,'2025-08-03','Publicaci√≥n de Resultados (PENDIENTE)','2025-08-03','results',4);
/*!40000 ALTER TABLE `contest_dates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest_requirements`
--

DROP TABLE IF EXISTS `contest_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_requirements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(100) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `priority` int NOT NULL,
  `required` bit(1) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `contest_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqjwvjjsvo1opgjg5xwhm6veka` (`contest_id`),
  CONSTRAINT `FKqjwvjjsvo1opgjg5xwhm6veka` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest_requirements`
--

LOCK TABLES `contest_requirements` WRITE;
/*!40000 ALTER TABLE `contest_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contests`
--

DROP TABLE IF EXISTS `contests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bases_url` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `class_` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `description_url` varchar(255) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `functions` varchar(255) DEFAULT NULL,
  `inscription_end_date` datetime(6) DEFAULT NULL,
  `inscription_start_date` datetime(6) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` enum('ACTIVE','ARCHIVED','CANCELLED','CLOSED','DRAFT','FINISHED','IN_EVALUATION','PAUSED','RESULTS_PUBLISHED','SCHEDULED') DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contests`
--

LOCK TABLES `contests` WRITE;
/*!40000 ALTER TABLE `contests` DISABLE KEYS */;
INSERT INTO `contests` VALUES (1,'/api/files/contest-bases/concurso_codefensor_penal_clase03.pdf','FUNCIONARIOS Y PERSONAL JERARQUICO','03','2025-07-24 22:57:16.020953','DEFENSORIAS PENALES','/api/files/contest-descriptions/codefensor_penal_clase03_descripcion.pdf','2025-09-22','Defensa legal en causas penales y penales juveniles. Garantizar derechos fundamentales y debido proceso.','2025-09-22 23:59:59.000000','2025-07-24 00:00:00.000000','Co-Defensor/a Penal y Penal Juvenil - Clase 03','2025-07-24','ACTIVE','Co-Defensor Penal y Penal Juvenil - Clase 03 Multifuero','2025-07-24 22:57:16.020960'),(2,'/api/files/contest-bases/concurso_codefensor_civil_clase03.pdf','FUNCIONARIOS Y PERSONAL JERARQUICO','03','2025-07-24 22:57:16.032998','DEFENSORIAS CIVILES','/api/files/contest-descriptions/codefensor_civil_clase03_descripcion.pdf','2025-09-22','Asesoramiento y representaci√≥n legal en materias Civil, Comercial, Paz, Familia, Consumidor, Tributario y Concursal.','2025-09-22 23:59:59.000000','2025-07-24 00:00:00.000000','Co-Defensor/a Civil - Clase 03','2025-07-24','ACTIVE','Co-Defensor Civil - Clase 03 Multifuero','2025-07-24 22:57:16.033008'),(3,NULL,'FUNCIONARIOS Y PERSONAL JERARQUICO','03','2025-07-24 22:57:16.035647','ASESORIAS DE NI√ëOS, NI√ëAS, ADOLESCENTES Y PERSONAS CON CAPACIDAD RESTRINGIDA',NULL,'2025-09-22','Defensa y protecci√≥n de derechos de ni√±os, ni√±as, adolescentes y personas con capacidad restringida.',NULL,NULL,'Co-Asesor/a de NNAyPCR - Clase 03','2025-07-24','ACTIVE','Co-Asesor/a de NNAyPCR - Clase 03 Multifuero','2025-07-24 22:57:16.035659'),(4,'/api/files/contest-bases/concurso_secretario_clase02_prueba.pdf','FUNCIONARIOS Y PERSONAL JERARQUICO','02','2025-07-24 22:57:16.037894','SECRETARIAS JUDICIALES','/api/files/contest-descriptions/secretario_clase02_prueba_descripcion.pdf','2025-07-14','CONCURSO DE PRUEBA para validar restricciones de per√≠odo de inscripci√≥n. Las inscripciones est√°n CERRADAS para probar la correcci√≥n de seguridad del punto 12.','2025-07-14 23:59:59.000000','2025-05-25 00:00:00.000000','Secretario/a Judicial - Clase 02','2025-05-25','CLOSED','CONCURSO DE PRUEBA - Secretario/a Judicial Clase 02 (PER√çODO CERRADO)','2025-07-24 22:57:16.037900');
/*!40000 ALTER TABLE `contests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distributed_lock`
--

DROP TABLE IF EXISTS `distributed_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `distributed_lock` (
  `lockKey` varchar(255) NOT NULL,
  `lockedAt` datetime(6) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`lockKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `distributed_lock`
--

LOCK TABLES `distributed_lock` WRITE;
/*!40000 ALTER TABLE `distributed_lock` DISABLE KEYS */;
/*!40000 ALTER TABLE `distributed_lock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_audit`
--

DROP TABLE IF EXISTS `document_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_audit` (
  `id` binary(16) NOT NULL,
  `action_by` binary(16) DEFAULT NULL,
  `action_date` datetime(6) NOT NULL,
  `action_type` enum('ARCHIVED','CREATED','DELETED','RESTORED','UPDATED') NOT NULL,
  `document_id` binary(16) NOT NULL,
  `metadata` json DEFAULT NULL,
  `new_file_path` varchar(500) DEFAULT NULL,
  `old_file_path` varchar(500) DEFAULT NULL,
  `reason` text,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_document_audit_document_id` (`document_id`),
  KEY `idx_document_audit_user_id` (`user_id`),
  KEY `idx_document_audit_action_date` (`action_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_audit`
--

LOCK TABLES `document_audit` WRITE;
/*!40000 ALTER TABLE `document_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` binary(16) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `order` int DEFAULT NULL,
  `required` bit(1) NOT NULL,
  `parent_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK38wlce45ecy6m472frk5um7t0` (`code`),
  KEY `FKgm7p43mofkw563uq57ly1w208` (`parent_id`),
  CONSTRAINT `FKgm7p43mofkw563uq57ly1w208` FOREIGN KEY (`parent_id`) REFERENCES `document_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (_binary '®ª2€áFéà\Ë\›\˜û}','CERTIFICADO_LEY_MICAELA','Certificado de capacitaci√≥n en Ley Micaela (opcional)',_binary '','Certificado Ley Micaela',7,_binary '\0',NULL),(_binary 'jWñ\ËK\0¢Nµ\ ¬ªn','DNI_DORSO','Documento Nacional de Identidad - Lado posterior',_binary '','DNI (Dorso)',2,_binary '',NULL),(_binary 'AÅ˝\ıHOC~è\Œ\≈\Ì&\ıª','DNI_FRONTAL','Documento Nacional de Identidad - Lado frontal',_binary '','DNI (Frontal)',1,_binary '',NULL),(_binary 'd\’s9G+≠wΩ4\Áåz','DOCUMENTO_ADICIONAL','Cualquier documento adicional requerido espec√≠ficamente',_binary '','Documento Adicional',99,_binary '\0',NULL),(_binary 'õ\Ò\ıø\Ù∫K\‡∂\ﬁ3\–y\È∞˚','ANTECEDENTES_PENALES','Certificado de Antecedentes Penales vigente (antig√ºedad no mayor a 90 d√≠as)',_binary '','Certificado de Antecedentes Penales',4,_binary '',NULL),(_binary '´Ç•qáπLÆ±\Á*rp\Õm','CERTIFICADO_SIN_SANCIONES','Certificado que acredite no registrar sanciones disciplinarias',_binary '','Certificado Sin Sanciones Disciplinarias',6,_binary '',NULL),(_binary '\Ó@i∫w@MXõ\Ì`\√Dm\Úz','CONSTANCIA_CUIL','Constancia de C√≥digo √önico de Identificaci√≥n Laboral',_binary '','Constancia de CUIL',3,_binary '',NULL),(_binary '\ˆ\«\n\ÍÇ&C≥Å˙§Y4¿î','CERTIFICADO_PROFESIONAL_ANTIGUEDAD','Certificado de antig√ºedad en el ejercicio profesional',_binary '','Certificado de Antig√ºedad Profesional',5,_binary '',NULL);
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` binary(16) NOT NULL,
  `archived_at` datetime(6) DEFAULT NULL,
  `archived_by` binary(16) DEFAULT NULL,
  `comments` varchar(255) DEFAULT NULL,
  `content_type` varchar(255) NOT NULL,
  `error_message` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `processing_status` enum('PROCESSING','UPLOADING','UPLOAD_COMPLETE','UPLOAD_FAILED') NOT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `status` enum('APPROVED','ERROR','PENDING','PROCESSING','REJECTED') DEFAULT NULL,
  `upload_date` datetime(6) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `validated_at` datetime(6) DEFAULT NULL,
  `validated_by` binary(16) DEFAULT NULL,
  `version` int DEFAULT NULL,
  `document_type_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKis1i6nxslho3kvxr9nsg8x05l` (`document_type_id`),
  CONSTRAINT `FKis1i6nxslho3kvxr9nsg8x05l` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `education_record`
--

DROP TABLE IF EXISTS `education_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education_record` (
  `id` binary(16) NOT NULL,
  `academic_honors` varchar(255) DEFAULT NULL,
  `activity_role` varchar(100) DEFAULT NULL,
  `activity_type` varchar(100) DEFAULT NULL,
  `certification_number` varchar(100) DEFAULT NULL,
  `comments` text,
  `created_at` datetime(6) NOT NULL,
  `credit_hours` int DEFAULT NULL,
  `duration_hours` int DEFAULT NULL,
  `duration_years` int DEFAULT NULL,
  `education_status` enum('ABANDONED','COMPLETED','IN_PROGRESS','SUSPENDED') NOT NULL,
  `education_type` enum('CERTIFICATION','DIPLOMA','DOCTORAL_DEGREE','MASTER_DEGREE','POSTGRADUATE_DEGREE','PRIMARY_EDUCATION','SCIENTIFIC_ACTIVITY','SECONDARY_EDUCATION','TECHNICAL_DEGREE','TRAINING_COURSE','UNIVERSITY_DEGREE') NOT NULL,
  `end_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `field_of_study` varchar(255) DEFAULT NULL,
  `final_grade` decimal(4,2) DEFAULT NULL,
  `grade_scale` varchar(50) DEFAULT NULL,
  `graduation_date` date DEFAULT NULL,
  `institution_name` varchar(255) NOT NULL,
  `is_ongoing` bit(1) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `issuing_authority` varchar(255) DEFAULT NULL,
  `presentation_date` date DEFAULT NULL,
  `presentation_location` varchar(255) DEFAULT NULL,
  `program_title` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `supporting_document_url` varchar(500) DEFAULT NULL,
  `thesis_advisor` varchar(255) DEFAULT NULL,
  `thesis_title` varchar(500) DEFAULT NULL,
  `thesis_topic` text,
  `updated_at` datetime(6) NOT NULL,
  `verification_notes` text,
  `verification_status` enum('PENDING','REJECTED','VERIFIED') NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `updated_by` binary(16) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
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
-- Dumping data for table `education_record`
--

LOCK TABLES `education_record` WRITE;
/*!40000 ALTER TABLE `education_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `education_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examination_allowed_materials`
--

DROP TABLE IF EXISTS `examination_allowed_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_allowed_materials` (
  `examination_id` binary(16) NOT NULL,
  `material` varchar(255) DEFAULT NULL,
  KEY `FKjggmksusbgut6y8hhxi81a7n7` (`examination_id`),
  CONSTRAINT `FKjggmksusbgut6y8hhxi81a7n7` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examination_allowed_materials`
--

LOCK TABLES `examination_allowed_materials` WRITE;
/*!40000 ALTER TABLE `examination_allowed_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `examination_allowed_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examination_requirements`
--

DROP TABLE IF EXISTS `examination_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_requirements` (
  `examination_id` binary(16) NOT NULL,
  `requirement` varchar(255) DEFAULT NULL,
  KEY `FK7xvasvkdhkkhjp4y7e6yp0lh5` (`examination_id`),
  CONSTRAINT `FK7xvasvkdhkkhjp4y7e6yp0lh5` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examination_requirements`
--

LOCK TABLES `examination_requirements` WRITE;
/*!40000 ALTER TABLE `examination_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `examination_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examination_rules`
--

DROP TABLE IF EXISTS `examination_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_rules` (
  `examination_id` binary(16) NOT NULL,
  `rule` varchar(255) DEFAULT NULL,
  KEY `FKqruutf1gwuifsavy4kjr5td2` (`examination_id`),
  CONSTRAINT `FKqruutf1gwuifsavy4kjr5td2` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examination_rules`
--

LOCK TABLES `examination_rules` WRITE;
/*!40000 ALTER TABLE `examination_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `examination_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examination_security_violations`
--

DROP TABLE IF EXISTS `examination_security_violations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_security_violations` (
  `examination_id` binary(16) NOT NULL,
  `violation` varchar(255) DEFAULT NULL,
  KEY `FK8adigts8weqt2sixaisvcnnkh` (`examination_id`),
  CONSTRAINT `FK8adigts8weqt2sixaisvcnnkh` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examination_security_violations`
--

LOCK TABLES `examination_security_violations` WRITE;
/*!40000 ALTER TABLE `examination_security_violations` DISABLE KEYS */;
/*!40000 ALTER TABLE `examination_security_violations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examination_sessions`
--

DROP TABLE IF EXISTS `examination_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_sessions` (
  `id` binary(16) NOT NULL,
  `current_question_index` int DEFAULT NULL,
  `deadline` datetime(6) DEFAULT NULL,
  `examination_id` binary(16) DEFAULT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `status` enum('CREATED','FINISHED','INVALIDATED','IN_PROGRESS','PAUSED') DEFAULT NULL,
  `user_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examination_sessions`
--

LOCK TABLES `examination_sessions` WRITE;
/*!40000 ALTER TABLE `examination_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `examination_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examinations`
--

DROP TABLE IF EXISTS `examinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examinations` (
  `id` binary(16) NOT NULL,
  `answers` text,
  `cancellation_date` datetime(6) DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration_minutes` bigint DEFAULT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','DRAFT','EXPIRED','IN_PROGRESS','PUBLISHED') DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` enum('PSYCHOLOGICAL','TECHNICAL_ADMINISTRATIVE','TECHNICAL_LEGAL') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examinations`
--

LOCK TABLES `examinations` WRITE;
/*!40000 ALTER TABLE `examinations` DISABLE KEYS */;
/*!40000 ALTER TABLE `examinations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscription_circunscripciones`
--

DROP TABLE IF EXISTS `inscription_circunscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_circunscripciones` (
  `inscriptionId` binary(16) NOT NULL,
  `circunscripcion` varchar(255) DEFAULT NULL,
  KEY `FKbmyc4amr131lowyndev8lc6o5` (`inscriptionId`),
  CONSTRAINT `FKbmyc4amr131lowyndev8lc6o5` FOREIGN KEY (`inscriptionId`) REFERENCES `inscriptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscription_circunscripciones`
--

LOCK TABLES `inscription_circunscripciones` WRITE;
/*!40000 ALTER TABLE `inscription_circunscripciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `inscription_circunscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscription_notes`
--

DROP TABLE IF EXISTS `inscription_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscription_notes` (
  `id` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `created_by_username` varchar(255) NOT NULL,
  `inscription_id` binary(16) NOT NULL,
  `text` varchar(1000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscription_notes`
--

LOCK TABLES `inscription_notes` WRITE;
/*!40000 ALTER TABLE `inscription_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `inscription_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscriptions`
--

DROP TABLE IF EXISTS `inscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscriptions` (
  `id` binary(16) NOT NULL,
  `accepted_terms` bit(1) DEFAULT NULL,
  `centro_de_vida` varchar(255) DEFAULT NULL,
  `confirmed_personal_data` bit(1) DEFAULT NULL,
  `contest_id` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `current_step` enum('COMPLETED','DATA_CONFIRMATION','DOCUMENTATION','INITIAL','LOCATION_SELECTION','TERMS_ACCEPTANCE') DEFAULT NULL,
  `data_confirmation_date` datetime(6) DEFAULT NULL,
  `documentation_deadline` datetime(6) DEFAULT NULL,
  `documentos_completos` bit(1) DEFAULT NULL,
  `frozen_date` datetime(6) DEFAULT NULL,
  `inscription_date` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','APPROVED','CANCELLED','COMPLETED_PENDING_DOCS','COMPLETED_WITH_DOCS','FROZEN','PENDING','REJECTED') DEFAULT NULL,
  `terms_acceptance_date` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscriptions`
--

LOCK TABLES `inscriptions` WRITE;
/*!40000 ALTER TABLE `inscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` binary(16) NOT NULL,
  `acknowledged_at` datetime(6) DEFAULT NULL,
  `acknowledgement_level` enum('NONE','SIGNATURE_ADVANCED','SIGNATURE_BASIC','SIMPLE') NOT NULL,
  `content` text NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `recipient_id` binary(16) NOT NULL,
  `sent_at` datetime(6) NOT NULL,
  `signature_metadata` varchar(255) DEFAULT NULL,
  `signature_type` enum('BIOMETRIC','DECLARATION','DIGITAL_CERT','PIN') DEFAULT NULL,
  `signature_value` varchar(255) DEFAULT NULL,
  `status` enum('ACKNOWLEDGED','PENDING','READ','SENT') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `type` enum('CONTEST','GENERAL','INSCRIPTION','SYSTEM') NOT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `id` binary(16) NOT NULL,
  `order_number` int DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `question_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5bmv46so2y5igt9o9n9w4fh6y` (`question_id`),
  CONSTRAINT `FK5bmv46so2y5igt9o9n9w4fh6y` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `options`
--

LOCK TABLES `options` WRITE;
/*!40000 ALTER TABLE `options` DISABLE KEYS */;
/*!40000 ALTER TABLE `options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_correct_answers`
--

DROP TABLE IF EXISTS `question_correct_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_correct_answers` (
  `question_entity_id` binary(16) NOT NULL,
  `correct_answers` varchar(255) DEFAULT NULL,
  KEY `FK4ut56al9gufoagxlplssgfaup` (`question_entity_id`),
  CONSTRAINT `FK4ut56al9gufoagxlplssgfaup` FOREIGN KEY (`question_entity_id`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_correct_answers`
--

LOCK TABLES `question_correct_answers` WRITE;
/*!40000 ALTER TABLE `question_correct_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `question_correct_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` binary(16) NOT NULL,
  `correct_answer` varchar(255) DEFAULT NULL,
  `order_number` int DEFAULT NULL,
  `score` int DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `type` enum('MULTIPLE_CHOICE','SINGLE_CHOICE','TEXT','TRUE_FALSE') DEFAULT NULL,
  `examination_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1y24yn7v3jwjp7le455y5ki10` (`examination_id`),
  CONSTRAINT `FK1y24yn7v3jwjp7le455y5ki10` FOREIGN KEY (`examination_id`) REFERENCES `examinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` binary(16) NOT NULL,
  `name` enum('ROLE_ADMIN','ROLE_USER') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (_binary '∫`]˝\œZMµ*JD¨BU[','ROLE_USER'),(_binary '\ıp\Âc-I4≤™ïEˇ58\Í','ROLE_ADMIN');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_entity`
--

DROP TABLE IF EXISTS `user_entity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_entity` (
  `id` binary(16) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `cuit` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `dni` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `legal_address` varchar(255) DEFAULT NULL,
  `municipality` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `residential_address` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','BLOCKED','EXPIRED','INACTIVE','LOCKED') NOT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK954y33fqknr0qy4jiolrpjo7r` (`dni`),
  UNIQUE KEY `UK4xad1enskw4j1t2866f7sodrx` (`email`),
  UNIQUE KEY `UK2jsk4eakd0rmvybo409wgwxuw` (`username`),
  UNIQUE KEY `UKqj0ywt0gqra7hhxaaimq8gje4` (`cuit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_entity`
--

LOCK TABLES `user_entity` WRITE;
/*!40000 ALTER TABLE `user_entity` DISABLE KEYS */;
INSERT INTO `user_entity` VALUES (_binary 'E\Ï\ËΩG≠∑å´J;3',NULL,NULL,'2025-07-24 22:57:13.513424',NULL,NULL,'12345678','admin@mpd.gov.ar','Admin','MPD',NULL,NULL,'$2a$10$Lj8eyV.xrpQCIBL7iG.pLu9z3/5pU/YDLKIuZ74hXMp0w2CBtaISW',NULL,NULL,NULL,'ACTIVE',NULL,'admin'),(_binary '†v\Ú\Ó\n\‰Lá\Û?1\Ê\Ù\„',NULL,NULL,'2025-07-24 22:57:13.601202',NULL,NULL,'87654321','user_test@example.com','Usuario','Test',NULL,NULL,'$2a$10$zlsrPbZ2cvEsEVzM4rcFLOxUeanbOgvUkpTfLBi6gGUWIcPnorh9C',NULL,NULL,NULL,'ACTIVE',NULL,'user_test');
/*!40000 ALTER TABLE `user_entity` ENABLE KEYS */;
UNLOCK TABLES;

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
  KEY `FKh8ciramu9cc9q3qcqiv4ue8a6` (`role_id`),
  CONSTRAINT `FK6y02653x6ebhsu2plf21ard62` FOREIGN KEY (`user_id`) REFERENCES `user_entity` (`id`),
  CONSTRAINT `FKh8ciramu9cc9q3qcqiv4ue8a6` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (_binary 'E\Ï\ËΩG≠∑å´J;3',_binary '∫`]˝\œZMµ*JD¨BU['),(_binary '†v\Ú\Ó\n\‰Lá\Û?1\Ê\Ù\„',_binary '∫`]˝\œZMµ*JD¨BU[');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_experience`
--

DROP TABLE IF EXISTS `work_experience`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_experience` (
  `id` binary(16) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current_position` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `job_description` text,
  `key_achievements` text,
  `location` varchar(255) DEFAULT NULL,
  `position_title` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `supporting_document_url` varchar(500) DEFAULT NULL,
  `technologies_used` text,
  `updated_at` datetime(6) NOT NULL,
  `verification_notes` text,
  `verification_status` enum('PENDING','REJECTED','VERIFIED') NOT NULL,
  `created_by` binary(16) DEFAULT NULL,
  `deleted_by` binary(16) DEFAULT NULL,
  `updated_by` binary(16) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
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

--
-- Dumping data for table `work_experience`
--

LOCK TABLES `work_experience` WRITE;
/*!40000 ALTER TABLE `work_experience` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_experience` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-24 23:11:02
