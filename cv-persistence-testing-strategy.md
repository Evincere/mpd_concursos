# 🧪 CV PERSISTENCE TESTING STRATEGY

## 🎯 **TESTING OBJECTIVES**

### **Primary Goals**
- ✅ Validate all CV entity persistence operations (CRUD)
- ✅ Test soft delete functionality and recovery
- ✅ Verify repository query methods work correctly
- ✅ Ensure data integrity and constraints
- ✅ Test transaction rollback scenarios
- ✅ Validate audit trail functionality

### **Success Criteria**
- ✅ 100% coverage of repository methods
- ✅ All entity lifecycle events tested
- ✅ Soft delete and recovery scenarios covered
- ✅ Performance benchmarks established
- ✅ Integration tests with real database

---

## 🏗️ **TESTING ARCHITECTURE**

### **1. TESTING LAYERS**

```
┌─────────────────────────────────────┐
│           INTEGRATION TESTS         │
│  (Full Spring Context + TestDB)     │
├─────────────────────────────────────┤
│           REPOSITORY TESTS          │
│     (@DataJpaTest + H2/MySQL)      │
├─────────────────────────────────────┤
│            SERVICE TESTS            │
│        (Mocked Dependencies)        │
├─────────────────────────────────────┤
│             UNIT TESTS              │
│         (Entity Validation)         │
└─────────────────────────────────────┘
```

### **2. TESTING TECHNOLOGIES**

| **Layer** | **Technology** | **Purpose** |
|-----------|----------------|-------------|
| **Unit Tests** | JUnit 5 + AssertJ | Entity validation, business logic |
| **Repository Tests** | @DataJpaTest + H2 | JPA repository methods |
| **Service Tests** | @SpringBootTest + Mockito | Service layer with mocked repos |
| **Integration Tests** | @SpringBootTest + TestContainers | Full stack with real MySQL |

---

## 📋 **TEST CATEGORIES**

### **1. ENTITY TESTS**

#### **WorkExperienceEntity Tests**
```java
@ExtendWith(MockitoExtension.class)
class WorkExperienceEntityTest {
    
    @Test
    void onCreate_ShouldSetDefaultValues() {
        // Test @PrePersist lifecycle
    }
    
    @Test
    void onUpdate_ShouldUpdateTimestamp() {
        // Test @PreUpdate lifecycle
    }
    
    @Test
    void softDelete_ShouldSetDeletionFields() {
        // Test soft delete field setting
    }
    
    @Test
    void validation_ShouldEnforceConstraints() {
        // Test Bean Validation annotations
    }
}
```

#### **EducationRecordEntity Tests**
```java
@ExtendWith(MockitoExtension.class)
class EducationRecordEntityTest {
    
    @Test
    void enumMapping_ShouldWorkCorrectly() {
        // Test EducationType and EducationStatus enums
    }
    
    @Test
    void dateValidation_ShouldEnforceLogicalOrder() {
        // Test start_date <= end_date constraints
    }
}
```

### **2. REPOSITORY TESTS**

#### **ExperienceRepository Tests**
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
class ExperienceRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private ExperienceRepository repository;
    
    @Test
    void findByUserId_ShouldReturnActiveExperiences() {
        // Test active record filtering
    }
    
    @Test
    void findByUser_ShouldOrderByStartDateDesc() {
        // Test ordering functionality
    }
    
    @Test
    void findRecoverableByUserId_ShouldReturnWithin24Hours() {
        // Test recovery window logic
    }
    
    @Test
    void save_ShouldPersistWithAuditFields() {
        // Test audit trail persistence
    }
}
```

### **3. SERVICE TESTS**

#### **WorkExperienceDeletionService Tests**
```java
@ExtendWith(MockitoExtension.class)
class WorkExperienceDeletionServiceTest {
    
    @Mock
    private ExperienceRepository repository;
    
    @InjectMocks
    private WorkExperienceDeletionService service;
    
    @Test
    void deleteWorkExperience_Success() {
        // Test successful soft deletion
    }
    
    @Test
    void deleteWorkExperience_NotFound() {
        // Test ResourceNotFoundException
    }
    
    @Test
    void deleteWorkExperience_AlreadyDeleted() {
        // Test IllegalStateException
    }
    
    @Test
    void canDelete_ShouldValidateBusinessRules() {
        // Test deletion eligibility
    }
}
```

#### **ExperienceServiceImpl Tests**
```java
@ExtendWith(MockitoExtension.class)
class ExperienceServiceImplTest {
    
    @Mock
    private ExperienceRepository repository;
    
    @Mock
    private WorkExperienceDeletionService deletionService;
    
    @InjectMocks
    private ExperienceServiceImpl service;
    
    @Test
    void getAllExperiencesByUserId_ShouldReturnActiveOnly() {
        // Test filtering of active experiences
    }
    
    @Test
    void createExperience_ShouldSetAuditFields() {
        // Test creation with audit trail
    }
    
    @Test
    void deleteExperience_ShouldUseDeletionService() {
        // Test delegation to deletion service
    }
}
```

### **4. INTEGRATION TESTS**

#### **CV Persistence Integration Tests**
```java
@SpringBootTest
@Testcontainers
@Transactional
class CvPersistenceIntegrationTest {
    
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("test_mpd_concursos")
            .withUsername("test")
            .withPassword("test");
    
    @Autowired
    private ExperienceService experienceService;
    
    @Autowired
    private EducationService educationService;
    
    @Test
    void fullWorkflowTest_CreateUpdateDelete() {
        // Test complete CRUD workflow
    }
    
    @Test
    void softDeleteRecoveryTest() {
        // Test soft delete and recovery workflow
    }
    
    @Test
    void concurrentAccessTest() {
        // Test concurrent operations
    }
}
```

---

## 🔧 **TEST CONFIGURATION**

### **1. Test Properties**

**File**: `application-test.properties`
```properties
# H2 Database for fast unit tests
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Logging
logging.level.org.springframework.orm.jpa=DEBUG
logging.level.org.springframework.transaction=DEBUG
logging.level.ar.gov.mpd.concursobackend=DEBUG
```

### **2. Test Data Builders**

```java
@Component
public class CvTestDataBuilder {
    
    public static WorkExperienceEntity createValidWorkExperience(UserEntity user) {
        return WorkExperienceEntity.builder()
                .user(user)
                .companyName("Test Company")
                .positionTitle("Test Position")
                .startDate(LocalDate.now().minusYears(2))
                .endDate(LocalDate.now().minusYears(1))
                .jobDescription("Test description")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .build();
    }
    
    public static EducationRecordEntity createValidEducationRecord(UserEntity user) {
        return EducationRecordEntity.builder()
                .user(user)
                .educationType(EducationType.UNIVERSITY_DEGREE)
                .educationStatus(EducationStatus.COMPLETED)
                .institutionName("Test University")
                .programTitle("Test Degree")
                .startDate(LocalDate.now().minusYears(4))
                .graduationDate(LocalDate.now().minusYears(1))
                .build();
    }
}
```

### **3. Custom Test Annotations**

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest
@Testcontainers
@Transactional
@TestPropertySource(locations = "classpath:application-test.properties")
public @interface CvIntegrationTest {
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(locations = "classpath:application-test.properties")
public @interface CvRepositoryTest {
}
```

---

## 📊 **TEST SCENARIOS**

### **1. CRUD Operations**

| **Operation** | **Scenario** | **Expected Result** |
|---------------|--------------|-------------------|
| **Create** | Valid entity | Persisted with audit fields |
| **Create** | Invalid entity | Validation exception |
| **Read** | Existing entity | Retrieved successfully |
| **Read** | Non-existent entity | Empty optional |
| **Update** | Valid changes | Updated with new timestamp |
| **Update** | Invalid changes | Validation exception |
| **Delete** | Existing entity | Soft deleted |
| **Delete** | Non-existent entity | ResourceNotFoundException |

### **2. Soft Delete Scenarios**

| **Scenario** | **Test Case** | **Expected Result** |
|--------------|---------------|-------------------|
| **Soft Delete** | Active entity | is_deleted=true, deleted_at set |
| **Query Active** | Mixed active/deleted | Only active returned |
| **Recovery** | Within 24h | Successfully restored |
| **Recovery** | After 24h | Recovery denied |
| **Double Delete** | Already deleted | IllegalStateException |

### **3. Business Logic Scenarios**

| **Scenario** | **Test Case** | **Expected Result** |
|--------------|---------------|-------------------|
| **User Ownership** | Delete other's entity | UnauthorizedException |
| **Document Handling** | Entity with docs | Document marked for deletion |
| **Audit Trail** | Any operation | Complete audit log |
| **Concurrent Access** | Multiple users | No data corruption |

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Basic Entity Tests** (Day 1)
1. ✅ Create WorkExperienceEntityTest
2. ✅ Create EducationRecordEntityTest
3. ✅ Test entity validation and lifecycle

### **Phase 2: Repository Tests** (Day 2)
1. ✅ Create ExperienceRepositoryTest
2. ✅ Create EducationRepositoryTest
3. ✅ Test all query methods

### **Phase 3: Service Tests** (Day 3)
1. ✅ Create WorkExperienceDeletionServiceTest
2. ✅ Create ExperienceServiceImplTest
3. ✅ Create EducationServiceImplTest

### **Phase 4: Integration Tests** (Day 4)
1. ✅ Set up TestContainers
2. ✅ Create full workflow tests
3. ✅ Performance and concurrency tests

### **Phase 5: Test Infrastructure** (Day 5)
1. ✅ Test data builders
2. ✅ Custom annotations
3. ✅ CI/CD integration

---

## 📈 **SUCCESS METRICS**

### **Coverage Targets**
- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Method Coverage**: > 95%

### **Performance Benchmarks**
- **Repository Operations**: < 50ms
- **Service Operations**: < 100ms
- **Integration Tests**: < 5s per test

### **Quality Gates**
- **Zero test failures** in CI/CD
- **No flaky tests** (>99% success rate)
- **Fast feedback** (< 2 minutes total test time)

---

## 🔍 **TESTING BEST PRACTICES**

### **1. Test Naming Convention**
```java
// Pattern: methodName_scenario_expectedResult
void findByUserId_withActiveAndDeletedRecords_shouldReturnOnlyActive()
void deleteWorkExperience_whenEntityNotFound_shouldThrowResourceNotFoundException()
```

### **2. Test Data Management**
- Use builders for test data creation
- Clean up after each test
- Use @Transactional for automatic rollback

### **3. Assertion Strategies**
```java
// Use AssertJ for fluent assertions
assertThat(result)
    .isNotNull()
    .hasSize(2)
    .extracting(WorkExperienceEntity::getCompanyName)
    .containsExactly("Company A", "Company B");
```

### **4. Mock Management**
```java
// Reset mocks between tests
@BeforeEach
void setUp() {
    reset(repository, deletionService);
}
```

This comprehensive testing strategy ensures robust validation of all CV persistence functionality while maintaining fast execution and reliable results.
