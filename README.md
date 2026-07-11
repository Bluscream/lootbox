# Lootbox

A premium giveaway platform where users can solve captcha, math puzzles, and quizzes to claim game keys, steam codes, and gift cards.

## Features

- **Robust Claim Verification**: Includes Cloudflare Turnstile CAPTCHA, dynamic math puzzles, and customizable trivia/quiz questions.
- **Steam & Discord Authentication**: Secure user login using official OAuth integrations.
- **Interactive Admin Control Panel**: Live overview of user activity, claims logs, and giveaway management.
- **Containerized Architecture**: Production-ready configuration using Docker and SQLite.

## Getting Started

1. Set up your environment variables in `.env`.
2. Generate the Prisma database client:
   ```bash
   npx prisma generate
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the application.
