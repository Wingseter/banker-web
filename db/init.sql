-- Initial schema for the `bank` database.
-- Mounted into the MySQL container at /docker-entrypoint-initdb.d/init.sql
-- and runs once on first start (when the data volume is empty).

CREATE DATABASE IF NOT EXISTS `bank`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `bank`;

-- docker-entrypoint loads this file with a default connection charset that
-- can corrupt UTF-8 bytes in the seed strings; pin the session explicitly.
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `email`    VARCHAR(255) NOT NULL,
  `name`     VARCHAR(64)  NOT NULL,
  `birth`    DATE         NOT NULL,
  `phone`    VARCHAR(32)  NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `address`  VARCHAR(255) NOT NULL,
  `job`      VARCHAR(64)      NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `accounts` (
  `id`    INT             NOT NULL AUTO_INCREMENT,
  `user`  INT             NOT NULL,
  `money` DECIMAL(20, 2)  NOT NULL DEFAULT 0,
  `card`  TINYINT(1)      NOT NULL DEFAULT 0,
  `type`  VARCHAR(64)     NOT NULL,
  `date`  DATETIME        NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_accounts_user` (`user`),
  CONSTRAINT `fk_accounts_user`
    FOREIGN KEY (`user`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cards` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `date`     DATETIME     NOT NULL,
  `max`      INT          NOT NULL,
  `lastuse`  DATETIME     NOT NULL,
  `type`     VARCHAR(64)  NOT NULL,
  `cardname` VARCHAR(64)      NULL,
  `user`     INT          NOT NULL,
  `account`  INT          NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cards_user`    (`user`),
  KEY `idx_cards_account` (`account`),
  CONSTRAINT `fk_cards_user`
    FOREIGN KEY (`user`)    REFERENCES `users`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cards_account`
    FOREIGN KEY (`account`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- history (per-account transaction log)
-- Composite PK (account, date, id) matches the legacy access pattern where
-- `id` is the daily sequence assigned by AccHistory.getNewId.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `history` (
  `account` INT             NOT NULL,
  `date`    DATETIME        NOT NULL,
  `id`      INT             NOT NULL,
  `type`    VARCHAR(45)     NOT NULL,
  `content` VARCHAR(255)    NOT NULL,
  `money`   DECIMAL(20, 2)  NOT NULL,
  `left`    DECIMAL(20, 2)  NOT NULL,
  PRIMARY KEY (`account`, `date`, `id`),
  CONSTRAINT `fk_history_account`
    FOREIGN KEY (`account`) REFERENCES `accounts` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Seed user for local development.
-- Password is `password123` hashed with bcrypt (cost 12) so you can log in
-- right after the container boots without running signup. Change in prod.
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `users`
  (`email`, `name`, `birth`, `phone`, `password`, `address`, `job`)
VALUES
  ('demo@banker.local',
   '데모유저',
   '1990-01-01',
   '01012345678',
   '$2b$12$lNb7FJbG9Qns1gN5Ety55ui6od6vOqfndRPY.CqJYRahtkLRhpJUu',
   '서울시 어딘가',
   '학생');
