// This is a conceptual script, adapt it to your project's setup
const mongoose = require('mongoose');
const Chat = require('../models/Chat'); // Adjust path as needed

async function migrateChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for migration');

    const directChats = await Chat.find({ chatType: 'direct', sortedParticipantIds: { $exists: false } });

    for (const chat of directChats) {
      if (chat.participants.length === 2) {
        const user1Id = chat.participants[0].user;
        const user2Id = chat.participants[1].user;
        const sortedIds = [user1Id, user2Id].sort((a, b) => a.toString().localeCompare(b.toString()));
        chat.sortedParticipantIds = sortedIds;
        await chat.save();
        console.log(`Migrated chat ${chat._id}`);
      } else {
        console.warn(`Skipping chat ${chat._id} as it's a direct chat but doesn't have exactly 2 participants.`);
      }
    }

    console.log('Chat migration complete.');
  } catch (error) {
    console.error('Chat migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateChats();