## Prisma ORM

If you want to change your database schema
- change the `schema.prisma` file manually
- run db:generate `bun run db:generate` (this will generate migrations files in the prisma/migrations folder)
  - a migration is a SQL file that contains instructions for creating or updating our database
- run db:migrate `bun run db:migrate` to update the database model
