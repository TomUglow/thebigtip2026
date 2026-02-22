import { PrismaClient } from '@prisma/client'

const SUPABASE_URL =
  'postgresql://postgres:sThumb_0214e@db.rwgyxmljcuzfaojflgyk.supabase.co:5432/postgres'

const NEON_URL =
  'postgresql://neondb_owner:npg_kyVHn0IDAhK9@ep-square-brook-a7j1d7fd.ap-southeast-2.aws.neon.tech/neondb?sslmode=require'

const src = new PrismaClient({ datasources: { db: { url: SUPABASE_URL } } })
const dst = new PrismaClient({ datasources: { db: { url: NEON_URL } } })

async function migrate() {
  console.log('Connecting to Supabase and Neon...')

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const users = await src.user.findMany()
  console.log(`Migrating ${users.length} users...`)
  for (const r of users) {
    await dst.user.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 2. Competitions ───────────────────────────────────────────────────────
  const competitions = await src.competition.findMany()
  console.log(`Migrating ${competitions.length} competitions...`)
  for (const r of competitions) {
    await dst.competition.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 3. Events ─────────────────────────────────────────────────────────────
  const events = await src.event.findMany()
  console.log(`Migrating ${events.length} events...`)
  for (const r of events) {
    await dst.event.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 4. CompetitionUsers ───────────────────────────────────────────────────
  const compUsers = await src.competitionUser.findMany()
  console.log(`Migrating ${compUsers.length} competition users...`)
  for (const r of compUsers) {
    await dst.competitionUser.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 5. CompetitionEvents ──────────────────────────────────────────────────
  const compEvents = await src.competitionEvent.findMany()
  console.log(`Migrating ${compEvents.length} competition events...`)
  for (const r of compEvents) {
    await dst.competitionEvent.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 6. Picks ──────────────────────────────────────────────────────────────
  const picks = await src.pick.findMany()
  console.log(`Migrating ${picks.length} picks...`)
  for (const r of picks) {
    await dst.pick.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 7. FavoriteTeams ──────────────────────────────────────────────────────
  const favTeams = await src.favoriteTeam.findMany()
  console.log(`Migrating ${favTeams.length} favorite teams...`)
  for (const r of favTeams) {
    await dst.favoriteTeam.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 8. Payments ───────────────────────────────────────────────────────────
  const payments = await src.payment.findMany()
  console.log(`Migrating ${payments.length} payments...`)
  for (const r of payments) {
    await dst.payment.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 9. OddsSnapshots ──────────────────────────────────────────────────────
  const snapshots = await src.oddsSnapshot.findMany()
  console.log(`Migrating ${snapshots.length} odds snapshots...`)
  for (const r of snapshots) {
    await dst.oddsSnapshot.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 10. Messages ──────────────────────────────────────────────────────────
  const messages = await src.message.findMany()
  console.log(`Migrating ${messages.length} messages...`)
  for (const r of messages) {
    await dst.message.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 11. OptionRequests ────────────────────────────────────────────────────
  const optionRequests = await src.optionRequest.findMany()
  console.log(`Migrating ${optionRequests.length} option requests...`)
  for (const r of optionRequests) {
    await dst.optionRequest.upsert({ where: { id: r.id }, update: r, create: r })
  }

  // ── 12. Notifications ─────────────────────────────────────────────────────
  const notifications = await src.notification.findMany()
  console.log(`Migrating ${notifications.length} notifications...`)
  for (const r of notifications) {
    await dst.notification.upsert({ where: { id: r.id }, update: r, create: r })
  }

  console.log('\n✅ Migration complete!')
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await src.$disconnect()
    await dst.$disconnect()
  })
