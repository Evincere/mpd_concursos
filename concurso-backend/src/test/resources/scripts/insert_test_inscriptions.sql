DELETE FROM inscriptions;

INSERT INTO inscriptions (contest_id, user_id, status, inscription_date)
VALUES 
    (1, 2, 'PENDING', CURRENT_TIMESTAMP()),
    (1, 3, 'PENDING', CURRENT_TIMESTAMP()),
    (2, 2, 'APPROVED', CURRENT_TIMESTAMP()); 