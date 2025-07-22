const mongoose = require("mongoose")
const Chat = require("../models/Chat") // Adjust path as needed

async function migrateChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // You can remove these deprecated options if you haven't already
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    console.log("MongoDB connected for migration")

    // Find direct chats that do NOT have sortedParticipantIdsString
    const directChats = await Chat.find({
      chatType: "direct",
      sortedParticipantIdsString: { $exists: false },
    })

    console.log(`Found ${directChats.length} direct chats to migrate.`)

    for (const chat of directChats) {
      if (chat.participants.length === 2) {
        const user1Id = chat.participants[0].user
        const user2Id = chat.participants[1].user
        const sortedIds = [user1Id, user2Id].sort((a, b) => a.toString().localeCompare(b.toString()))
        chat.sortedParticipantIds = sortedIds // Keep this for consistency if you want
        chat.sortedParticipantIdsString = sortedIds.join("_") // Populate the new string field
        await chat.save()
        console.log(`Migrated chat ${chat._id} with sortedParticipantIdsString: ${chat.sortedParticipantIdsString}`)
      } else {
        console.warn(`Skipping chat ${chat._id} as it's a direct chat but doesn't have exactly 2 participants.`)
      }
    }

    console.log("Chat migration complete.")
  } catch (error) {
    console.error("Chat migration failed:", error)
  } finally {
    await mongoose.disconnect()
  }
}

migrateChats()
