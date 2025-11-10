-- Crie o banco de dados SmartHabitTracker

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'SmartHabitTracker')
    DROP DATABASE SmartHabitTracker;
GO

CREATE DATABASE SmartHabitTracker;
GO

USE SmartHabitTracker;
GO

-- Criar tabela de usuários
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Criar tabela de hábitos
CREATE TABLE habits (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    days NVARCHAR(MAX) -- Armazenará JSON com dias marcados por mês
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

SELECT * FROM habits;
GO
