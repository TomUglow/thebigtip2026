import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateUsernames() {
  try {
    // Get all users without a username
    const usersWithoutUsername = await prisma.user.findMany({
      where: {
        username: {
          isNull: true,
        },
      },
    })

    console.log(`Found ${usersWithoutUsername.length} users without a username`)

    // Generate unique usernames
    for (const user of usersWithoutUsername) {
      let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
      let username = baseUsername
      let counter = 1

      // Check if username is unique, if not, add a counter
      while (true) {
        const existing = await prisma.user.findUnique({
          where: { username },
        })
        if (!existing) {
          break
        }
        username = `${baseUsername}_${counter}`
        counter++
      }

      // Update the user with the generated username
      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      })

      console.log(`Generated username "${username}" for user "${user.email}"`)
    }

    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateUsernames()
