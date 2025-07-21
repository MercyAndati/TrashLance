const mongoose = require("mongoose");

// Replace with your Atlas connection string
const MONGO_URI = "mongodb+srv://mercy:A7OLUUENX7rGf1xE@cluster0.wuiz1os.mongodb.net/trashlance?retryWrites=true&w=majority&appName=Cluster0";

const chatSchema = new mongoose.Schema({
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      joinedAt: Date,
      lastSeen: Date,
    },
  ],
  chatType: String,
  relatedBooking: mongoose.Schema.Types.ObjectId,
  status: String,
});

const Chat = mongoose.model("Chat", chatSchema, "chats");

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB Atlas");

  const chats = await Chat.find({});
  let updated = 0;

  for (const chat of chats) {
    // Sort participants by user ID string
    const sorted = [...chat.participants].sort((a, b) =>
      a.user.toString().localeCompare(b.user.toString())
    );
    // Only update if sorting changed anything
    const changed = chat.participants.some((p, i) => !p.user.equals(sorted[i].user));
    if (changed) {
      chat.participants = sorted;
      await chat.save();
      updated++;
    }
  }

  console.log(`Sorted participants in ${updated} chat(s).`);

  // Drop and recreate the unique index
  try {
    await Chat.collection.dropIndex("participants.user_1_chatType_1_relatedBooking_1");
    console.log("Dropped old unique index.");
  } catch (err) {
    if (err.codeName === "IndexNotFound") {
      console.log("Index not found, skipping drop.");
    } else {
      throw err;
    }
  }

  await Chat.collection.createIndex(
    { "participants.user": 1, chatType: 1, relatedBooking: 1 },
    { unique: true, partialFilterExpression: { status: "active" } }
  );
  console.log("Recreated unique index.");

  await mongoose.disconnect();
  console.log("Migration complete. You can now use your chat feature safely!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});