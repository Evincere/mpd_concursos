package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.domain.model.Examination;
import ar.gov.mpd.concursobackend.examination.domain.model.ExaminationSession;
import ar.gov.mpd.concursobackend.examination.domain.model.Question;
import ar.gov.mpd.concursobackend.examination.domain.model.QuestionType;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.AnswerEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationSessionEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.QuestionEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.QuestionOptionEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-02-25T20:44:30-0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.6 (Oracle Corporation)"
)
@Component
public class ExaminationMapperImpl implements ExaminationMapper {

    @Override
    public ExaminationEntity toEntity(Examination domain) {
        if ( domain == null ) {
            return null;
        }

        ExaminationEntity examinationEntity = new ExaminationEntity();

        examinationEntity.setDuration( domain.getDuration() );
        examinationEntity.setId( map( domain.getId() ) );
        examinationEntity.setTitle( domain.getTitle() );
        examinationEntity.setDescription( domain.getDescription() );
        examinationEntity.setStatus( domain.getStatus() );
        examinationEntity.setStartTime( domain.getStartTime() );
        examinationEntity.setEndTime( domain.getEndTime() );
        examinationEntity.setType( domain.getType() );

        examinationEntity.setDurationMinutes( domain.getDuration().toMinutes() );

        linkExaminationQuestions( examinationEntity, domain );

        return examinationEntity;
    }

    @Override
    public Examination toDomain(ExaminationEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Examination.ExaminationBuilder examination = Examination.builder();

        examination.type( entity.getType() );
        examination.id( map( entity.getId() ) );
        examination.title( entity.getTitle() );
        examination.description( entity.getDescription() );
        examination.status( entity.getStatus() );
        examination.startTime( entity.getStartTime() );
        examination.endTime( entity.getEndTime() );

        examination.duration( java.time.Duration.ofMinutes(entity.getDurationMinutes()) );

        return examination.build();
    }

    @Override
    public ExaminationSessionEntity toEntity(ExaminationSession domain) {
        if ( domain == null ) {
            return null;
        }

        ExaminationSessionEntity examinationSessionEntity = new ExaminationSessionEntity();

        examinationSessionEntity.setId( domain.getId() );
        examinationSessionEntity.setExaminationId( domain.getExaminationId() );
        examinationSessionEntity.setUserId( domain.getUserId() );
        examinationSessionEntity.setStartTime( domain.getStartTime() );
        examinationSessionEntity.setDeadline( domain.getDeadline() );
        examinationSessionEntity.setAnswers( answerListToAnswerEntityList( domain.getAnswers() ) );
        examinationSessionEntity.setCurrentQuestionIndex( domain.getCurrentQuestionIndex() );
        examinationSessionEntity.setStatus( domain.getStatus() );

        return examinationSessionEntity;
    }

    @Override
    public ExaminationSession toDomain(ExaminationSessionEntity entity) {
        if ( entity == null ) {
            return null;
        }

        ExaminationSession.ExaminationSessionBuilder examinationSession = ExaminationSession.builder();

        examinationSession.id( entity.getId() );
        examinationSession.examinationId( entity.getExaminationId() );
        examinationSession.userId( entity.getUserId() );
        examinationSession.startTime( entity.getStartTime() );
        examinationSession.deadline( entity.getDeadline() );
        examinationSession.answers( answerEntityListToAnswerList( entity.getAnswers() ) );
        examinationSession.currentQuestionIndex( entity.getCurrentQuestionIndex() );
        examinationSession.status( entity.getStatus() );

        return examinationSession.build();
    }

    @Override
    public Answer toDomain(AnswerEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Answer.AnswerBuilder answer = Answer.builder();

        answer.sessionId( entitySessionId( entity ) );
        answer.id( entity.getId() );
        answer.questionId( entity.getQuestionId() );
        answer.timestamp( entity.getTimestamp() );
        answer.responseTimeInMillis( entity.getResponseTimeInMillis() );
        answer.hash( entity.getHash() );
        answer.attempts( entity.getAttempts() );
        answer.status( entity.getStatus() );

        answer.response( responseToArray(entity.getResponse()) );

        return answer.build();
    }

    @Override
    public AnswerEntity toEntity(Answer domain) {
        if ( domain == null ) {
            return null;
        }

        AnswerEntity answerEntity = new AnswerEntity();

        answerEntity.setId( domain.getId() );
        answerEntity.setQuestionId( domain.getQuestionId() );
        answerEntity.setTimestamp( domain.getTimestamp() );
        answerEntity.setResponseTimeInMillis( domain.getResponseTimeInMillis() );
        answerEntity.setHash( domain.getHash() );
        answerEntity.setAttempts( domain.getAttempts() );
        answerEntity.setStatus( domain.getStatus() );

        answerEntity.setResponse( arrayToResponse(domain.getResponse()) );

        return answerEntity;
    }

    @Override
    public QuestionEntity toEntity(Question domain) {
        if ( domain == null ) {
            return null;
        }

        QuestionEntity questionEntity = new QuestionEntity();

        questionEntity.setId( domain.getId() );
        questionEntity.setText( domain.getText() );
        questionEntity.setType( questionTypeToQuestionType( domain.getType() ) );
        questionEntity.setOptions( questionOptionListToQuestionOptionEntityList( domain.getOptions() ) );
        questionEntity.setPoints( domain.getPoints() );
        questionEntity.setOrderIndex( domain.getOrderIndex() );

        linkQuestionOptions( questionEntity, domain );

        return questionEntity;
    }

    @Override
    public Question toDomain(QuestionEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Question.QuestionBuilder question = Question.builder();

        question.options( questionOptionEntityListToQuestionOptionList( entity.getOptions() ) );
        question.id( entity.getId() );
        question.text( entity.getText() );
        question.type( questionTypeToQuestionType1( entity.getType() ) );
        question.points( entity.getPoints() );
        question.orderIndex( entity.getOrderIndex() );

        return question.build();
    }

    @Override
    public List<Question> toDomainQuestions(List<QuestionEntity> entities) {
        if ( entities == null ) {
            return null;
        }

        List<Question> list = new ArrayList<Question>( entities.size() );
        for ( QuestionEntity questionEntity : entities ) {
            list.add( toDomain( questionEntity ) );
        }

        return list;
    }

    @Override
    public QuestionOptionEntity toEntity(Question.QuestionOption domain) {
        if ( domain == null ) {
            return null;
        }

        QuestionOptionEntity questionOptionEntity = new QuestionOptionEntity();

        questionOptionEntity.setId( domain.getId() );
        questionOptionEntity.setText( domain.getText() );
        questionOptionEntity.setCorrect( domain.isCorrect() );

        return questionOptionEntity;
    }

    @Override
    public Question.QuestionOption toDomain(QuestionOptionEntity entity) {
        if ( entity == null ) {
            return null;
        }

        Question.QuestionOption.QuestionOptionBuilder questionOption = Question.QuestionOption.builder();

        questionOption.isCorrect( entity.isCorrect() );
        questionOption.id( entity.getId() );
        questionOption.text( entity.getText() );

        return questionOption.build();
    }

    protected List<AnswerEntity> answerListToAnswerEntityList(List<Answer> list) {
        if ( list == null ) {
            return null;
        }

        List<AnswerEntity> list1 = new ArrayList<AnswerEntity>( list.size() );
        for ( Answer answer : list ) {
            list1.add( toEntity( answer ) );
        }

        return list1;
    }

    protected List<Answer> answerEntityListToAnswerList(List<AnswerEntity> list) {
        if ( list == null ) {
            return null;
        }

        List<Answer> list1 = new ArrayList<Answer>( list.size() );
        for ( AnswerEntity answerEntity : list ) {
            list1.add( toDomain( answerEntity ) );
        }

        return list1;
    }

    private UUID entitySessionId(AnswerEntity answerEntity) {
        if ( answerEntity == null ) {
            return null;
        }
        ExaminationSessionEntity session = answerEntity.getSession();
        if ( session == null ) {
            return null;
        }
        UUID id = session.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    protected ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType questionTypeToQuestionType(QuestionType questionType) {
        if ( questionType == null ) {
            return null;
        }

        ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType questionType1;

        switch ( questionType ) {
            case MULTIPLE_CHOICE: questionType1 = ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType.MULTIPLE_CHOICE;
            break;
            case SINGLE_CHOICE: questionType1 = ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType.SINGLE_CHOICE;
            break;
            case TRUE_FALSE: questionType1 = ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType.TRUE_FALSE;
            break;
            case ORDERING: questionType1 = ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType.ORDERING;
            break;
            case DEVELOPMENT: questionType1 = ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType.DEVELOPMENT;
            break;
            default: throw new IllegalArgumentException( "Unexpected enum constant: " + questionType );
        }

        return questionType1;
    }

    protected List<QuestionOptionEntity> questionOptionListToQuestionOptionEntityList(List<Question.QuestionOption> list) {
        if ( list == null ) {
            return null;
        }

        List<QuestionOptionEntity> list1 = new ArrayList<QuestionOptionEntity>( list.size() );
        for ( Question.QuestionOption questionOption : list ) {
            list1.add( toEntity( questionOption ) );
        }

        return list1;
    }

    protected List<Question.QuestionOption> questionOptionEntityListToQuestionOptionList(List<QuestionOptionEntity> list) {
        if ( list == null ) {
            return null;
        }

        List<Question.QuestionOption> list1 = new ArrayList<Question.QuestionOption>( list.size() );
        for ( QuestionOptionEntity questionOptionEntity : list ) {
            list1.add( toDomain( questionOptionEntity ) );
        }

        return list1;
    }

    protected QuestionType questionTypeToQuestionType1(ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType questionType) {
        if ( questionType == null ) {
            return null;
        }

        QuestionType questionType1;

        switch ( questionType ) {
            case MULTIPLE_CHOICE: questionType1 = QuestionType.MULTIPLE_CHOICE;
            break;
            case SINGLE_CHOICE: questionType1 = QuestionType.SINGLE_CHOICE;
            break;
            case TRUE_FALSE: questionType1 = QuestionType.TRUE_FALSE;
            break;
            case ORDERING: questionType1 = QuestionType.ORDERING;
            break;
            case DEVELOPMENT: questionType1 = QuestionType.DEVELOPMENT;
            break;
            default: throw new IllegalArgumentException( "Unexpected enum constant: " + questionType );
        }

        return questionType1;
    }
}
