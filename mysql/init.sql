CREATE USER IF NOT EXISTS 'mpd_user'@'%' IDENTIFIED BY 'mpd_password';
GRANT ALL PRIVILEGES ON mpd_concursos.* TO 'mpd_user'@'%';
FLUSH PRIVILEGES;
