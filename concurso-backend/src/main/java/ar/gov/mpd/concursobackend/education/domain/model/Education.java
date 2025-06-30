package ar.gov.mpd.concursobackend.education.domain.model;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain model for education records
 */
public class Education {
    private UUID id;
    private UUID userId;
    
    // Common fields for all education types
    private EducationType type;
    private EducationStatus status;
    private String title;
    private String institution;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate issueDate;
    private String documentUrl;
    
    // Fields for higher education and university degrees
    private Integer durationYears;
    private Double average;
    
    // Fields for postgraduate studies
    private String thesisTopic;
    
    // Fields for diplomas and training courses
    private Integer hourlyLoad;
    private Boolean hadFinalEvaluation;
    
    // Fields for scientific activities
    private ScientificActivityType activityType;
    private String topic;
    private ScientificActivityRole activityRole;
    private String expositionPlaceDate;
    private String comments;
    
    // Constructor por defecto
    public Education() {
    }
    
    // Full constructor
    public Education(UUID id, UUID userId, EducationType type, EducationStatus status, String title,
                    String institution, LocalDate startDate, LocalDate endDate, LocalDate issueDate,
                    String documentUrl, Integer durationYears, Double average, String thesisTopic,
                    Integer hourlyLoad, Boolean hadFinalEvaluation, ScientificActivityType activityType,
                    String topic, ScientificActivityRole activityRole, String expositionPlaceDate, String comments) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.status = status;
        this.title = title;
        this.institution = institution;
        this.startDate = startDate;
        this.endDate = endDate;
        this.issueDate = issueDate;
        this.documentUrl = documentUrl;
        this.durationYears = durationYears;
        this.average = average;
        this.thesisTopic = thesisTopic;
        this.hourlyLoad = hourlyLoad;
        this.hadFinalEvaluation = hadFinalEvaluation;
        this.activityType = activityType;
        this.topic = topic;
        this.activityRole = activityRole;
        this.expositionPlaceDate = expositionPlaceDate;
        this.comments = comments;
    }
    
    // Builder estático
    public static EducationBuilder builder() {
        return new EducationBuilder();
    }
    
    // Getters y setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public EducationType getType() {
        return type;
    }
    
    public void setType(EducationType type) {
        this.type = type;
    }
    
    public EducationStatus getStatus() {
        return status;
    }
    
    public void setStatus(EducationStatus status) {
        this.status = status;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getInstitution() {
        return institution;
    }
    
    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }
    
    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }
    
    public String getDocumentUrl() {
        return documentUrl;
    }
    
    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }
    
    public Integer getDurationYears() {
        return durationYears;
    }
    
    public void setDurationYears(Integer durationYears) {
        this.durationYears = durationYears;
    }
    
    public Double getAverage() {
        return average;
    }
    
    public void setAverage(Double average) {
        this.average = average;
    }
    
    public String getThesisTopic() {
        return thesisTopic;
    }
    
    public void setThesisTopic(String thesisTopic) {
        this.thesisTopic = thesisTopic;
    }
    
    public Integer getHourlyLoad() {
        return hourlyLoad;
    }
    
    public void setHourlyLoad(Integer hourlyLoad) {
        this.hourlyLoad = hourlyLoad;
    }
    
    public Boolean getHadFinalEvaluation() {
        return hadFinalEvaluation;
    }
    
    public void setHadFinalEvaluation(Boolean hadFinalEvaluation) {
        this.hadFinalEvaluation = hadFinalEvaluation;
    }
    
    public ScientificActivityType getActivityType() {
        return activityType;
    }
    
    public void setActivityType(ScientificActivityType activityType) {
        this.activityType = activityType;
    }
    
    public String getTopic() {
        return topic;
    }
    
    public void setTopic(String topic) {
        this.topic = topic;
    }
    
    public ScientificActivityRole getActivityRole() {
        return activityRole;
    }
    
    public void setActivityRole(ScientificActivityRole activityRole) {
        this.activityRole = activityRole;
    }
    
    public String getExpositionPlaceDate() {
        return expositionPlaceDate;
    }
    
    public void setExpositionPlaceDate(String expositionPlaceDate) {
        this.expositionPlaceDate = expositionPlaceDate;
    }
    
    public String getComments() {
        return comments;
    }
    
    public void setComments(String comments) {
        this.comments = comments;
    }
    
    // Inner Builder class
    public static class EducationBuilder {
        private UUID id;
        private UUID userId;
        private EducationType type;
        private EducationStatus status;
        private String title;
        private String institution;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDate issueDate;
        private String documentUrl;
        private Integer durationYears;
        private Double average;
        private String thesisTopic;
        private Integer hourlyLoad;
        private Boolean hadFinalEvaluation;
        private ScientificActivityType activityType;
        private String topic;
        private ScientificActivityRole activityRole;
        private String expositionPlaceDate;
        private String comments;
        
        EducationBuilder() {
        }
        
        public EducationBuilder id(UUID id) {
            this.id = id;
            return this;
        }
        
        public EducationBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }
        
        public EducationBuilder type(EducationType type) {
            this.type = type;
            return this;
        }
        
        public EducationBuilder status(EducationStatus status) {
            this.status = status;
            return this;
        }
        
        public EducationBuilder title(String title) {
            this.title = title;
            return this;
        }
        
        public EducationBuilder institution(String institution) {
            this.institution = institution;
            return this;
        }

        public EducationBuilder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public EducationBuilder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public EducationBuilder issueDate(LocalDate issueDate) {
            this.issueDate = issueDate;
            return this;
        }
        
        public EducationBuilder documentUrl(String documentUrl) {
            this.documentUrl = documentUrl;
            return this;
        }
        
        public EducationBuilder durationYears(Integer durationYears) {
            this.durationYears = durationYears;
            return this;
        }
        
        public EducationBuilder average(Double average) {
            this.average = average;
            return this;
        }
        
        public EducationBuilder thesisTopic(String thesisTopic) {
            this.thesisTopic = thesisTopic;
            return this;
        }
        
        public EducationBuilder hourlyLoad(Integer hourlyLoad) {
            this.hourlyLoad = hourlyLoad;
            return this;
        }
        
        public EducationBuilder hadFinalEvaluation(Boolean hadFinalEvaluation) {
            this.hadFinalEvaluation = hadFinalEvaluation;
            return this;
        }
        
        public EducationBuilder activityType(ScientificActivityType activityType) {
            this.activityType = activityType;
            return this;
        }
        
        public EducationBuilder topic(String topic) {
            this.topic = topic;
            return this;
        }
        
        public EducationBuilder activityRole(ScientificActivityRole activityRole) {
            this.activityRole = activityRole;
            return this;
        }
        
        public EducationBuilder expositionPlaceDate(String expositionPlaceDate) {
            this.expositionPlaceDate = expositionPlaceDate;
            return this;
        }
        
        public EducationBuilder comments(String comments) {
            this.comments = comments;
            return this;
        }
        
        public Education build() {
            return new Education(id, userId, type, status, title, institution, startDate, endDate, issueDate,
                                documentUrl, durationYears, average, thesisTopic, hourlyLoad, hadFinalEvaluation,
                                activityType, topic, activityRole, expositionPlaceDate, comments);
        }
    }
    
    /**
     * Factory method to create an education instance based on type
     */
    public static Education createForType(EducationType type) {
        return Education.builder()
                .id(UUID.randomUUID())
                .type(type)
                .status(EducationStatus.IN_PROGRESS)
                .build();
    }
} 