package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.auth.application.port.IUserService;
import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.notification.application.dto.MassNotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.MassNotificationResponse;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendMassNotificationUseCase;
import ar.gov.mpd.concursobackend.notification.application.port.in.SendNotificationUseCase;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class MassNotificationService implements SendMassNotificationUseCase {

    private final IUserService userService;
    private final SendNotificationUseCase sendNotificationUseCase;

    @Override
    @Transactional
    public MassNotificationResponse sendMassNotification(MassNotificationRequest request) {
        log.debug("Processing mass notification request: {}", request);

        // Generate a batch ID
        UUID batchId = UUID.randomUUID();

        // Get recipients
        List<User> recipients = getRecipients(request);
        int totalRecipients = recipients.size();

        log.debug("Found {} recipients for mass notification", totalRecipients);

        // Check if this is a scheduled notification
        if (request.getScheduledTime() != null && request.getScheduledTime().isAfter(LocalDateTime.now())) {
            // TODO: Implement scheduled notifications with a task scheduler
            log.debug("Scheduling notification for: {}", request.getScheduledTime());

            return MassNotificationResponse.builder()
                    .batchId(batchId)
                    .totalRecipients(totalRecipients)
                    .successCount(0)
                    .failureCount(0)
                    .sentNotificationIds(new ArrayList<>())
                    .processedAt(LocalDateTime.now())
                    .scheduledTime(request.getScheduledTime())
                    .status("SCHEDULED")
                    .build();
        }

        // Process notifications asynchronously
        CompletableFuture<MassNotificationResponse> future = processNotificationsAsync(batchId, recipients, request);

        // Return initial response
        return MassNotificationResponse.builder()
                .batchId(batchId)
                .totalRecipients(totalRecipients)
                .successCount(0)
                .failureCount(0)
                .sentNotificationIds(new ArrayList<>())
                .processedAt(LocalDateTime.now())
                .status("PROCESSING")
                .build();
    }

    @Async
    protected CompletableFuture<MassNotificationResponse> processNotificationsAsync(
            UUID batchId, List<User> recipients, MassNotificationRequest request) {

        log.debug("Starting async processing of {} notifications for batch {}", recipients.size(), batchId);

        List<UUID> sentNotificationIds = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (User recipient : recipients) {
            try {
                NotificationRequest notificationRequest = NotificationRequest.builder()
                        .recipientUsername(recipient.getUsername().value())
                        .subject(request.getSubject())
                        .content(request.getContent())
                        .type(request.getType())
                        .acknowledgementLevel(request.getAcknowledgementLevel())
                        .metadata(request.getMetadata())
                        .build();

                var response = sendNotificationUseCase.sendNotification(notificationRequest);
                sentNotificationIds.add(response.getId());
                successCount++;

                log.debug("Successfully sent notification to user: {}", recipient.getUsername().value());
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to send notification to user: {}", recipient.getUsername().value(), e);
            }
        }

        MassNotificationResponse response = MassNotificationResponse.builder()
                .batchId(batchId)
                .totalRecipients(recipients.size())
                .successCount(successCount)
                .failureCount(failureCount)
                .sentNotificationIds(sentNotificationIds)
                .processedAt(LocalDateTime.now())
                .status(failureCount == 0 ? "COMPLETED" : "COMPLETED_WITH_ERRORS")
                .build();

        log.debug("Completed processing batch {}: success={}, failures={}",
                batchId, successCount, failureCount);

        // TODO: Store the response in a repository for later querying

        return CompletableFuture.completedFuture(response);
    }

    private List<User> getRecipients(MassNotificationRequest request) {
        Set<User> recipients = new HashSet<>();

        // If specific recipient IDs are provided, use those
        if (request.getRecipientIds() != null && !request.getRecipientIds().isEmpty()) {
            for (UUID userId : request.getRecipientIds()) {
                userService.getById(userId).ifPresent(recipients::add);
            }
        }
        // Otherwise, get users by roles
        else if (request.getRecipientRoles() != null && !request.getRecipientRoles().isEmpty()) {
            for (RoleEnum role : request.getRecipientRoles()) {
                recipients.addAll(userService.findUsersByRole(role));
            }
        }

        return new ArrayList<>(recipients);
    }
}
