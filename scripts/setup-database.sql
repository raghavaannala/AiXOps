-- AiOps Database Setup Script for MSSQL
-- Run this script in SQL Server Management Studio (SSMS) to create the database

-- Create the database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AiOps')
BEGIN
    CREATE DATABASE AiOps;
    PRINT 'Database AiOps created successfully';
END
ELSE
BEGIN
    PRINT 'Database AiOps already exists';
END
GO

-- Switch to the database
USE AiOps;
GO

-- The tables will be created automatically by the /api/db/init endpoint
-- But you can also run this script to create them manually:

-- Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    firebase_uid NVARCHAR(128) UNIQUE NOT NULL,
    email NVARCHAR(255),
    display_name NVARCHAR(255),
    photo_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Gmail Connections table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GmailConnections' AND xtype='U')
CREATE TABLE GmailConnections (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    email NVARCHAR(255),
    access_token NVARCHAR(MAX),
    refresh_token NVARCHAR(MAX),
    expires_at DATETIME2,
    connected SMALLINT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Tracked Emails table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TrackedEmails' AND xtype='U')
CREATE TABLE TrackedEmails (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    gmail_id NVARCHAR(100),
    thread_id NVARCHAR(100) NOT NULL,
    recipient NVARCHAR(255),
    sender NVARCHAR(255),
    subject NVARCHAR(500),
    snippet NVARCHAR(MAX),
    body NVARCHAR(MAX),
    sent_at DATETIME2,
    has_reply SMALLINT DEFAULT 0,
    dismissed SMALLINT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- User Settings table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserSettings' AND xtype='U')
CREATE TABLE UserSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    threshold_minutes INT DEFAULT 2880,  -- 2 days default
    auto_refresh SMALLINT DEFAULT 1,
    auto_redraft SMALLINT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Generated Drafts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GeneratedDrafts' AND xtype='U')
CREATE TABLE GeneratedDrafts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tracked_email_id INT NOT NULL,
    content NVARCHAR(MAX),
    generated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tracked_email_id) REFERENCES TrackedEmails(id) ON DELETE CASCADE
);

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TrackedEmails_UserId')
    CREATE INDEX IX_TrackedEmails_UserId ON TrackedEmails(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TrackedEmails_ThreadId')
    CREATE INDEX IX_TrackedEmails_ThreadId ON TrackedEmails(thread_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GmailConnections_UserId')
    CREATE INDEX IX_GmailConnections_UserId ON GmailConnections(user_id);

PRINT 'All tables and indexes created successfully';
GO
