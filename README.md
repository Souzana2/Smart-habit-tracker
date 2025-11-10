# Habit Tracker

Este é um aplicativo de rastreamento de hábitos construído com Flask e JavaScript. Ele permite que os usuários se registrem, façam login e rastreiem seus hábitos diários em uma visualização de calendário.

## Funcionalidades

*   Registro e login de usuários
*   Adicionar, editar e apagar hábitos
*   Marcar hábitos como concluídos para cada dia
*   Visualização de calendário para rastreamento mensal
*   Dashboard com estatísticas de progresso

## Como Executar

1.  **Instale as dependências:**
    ```bash
    pip install Flask pyodbc
    ```

2.  **Configure o banco de dados:**
    *   Certifique-se de ter um servidor SQL Server em execução.
    *   Execute o script `database_setup.sql` para criar o banco de dados e as tabelas necessárias.
    *   Atualize a string de conexão no arquivo `app.py` com suas credenciais.

3.  **Inicie o aplicativo:**
    ```bash
    python app.py
    ```

4.  Acesse o aplicativo em seu navegador, geralmente em `http://127.0.0.1:5000`.
