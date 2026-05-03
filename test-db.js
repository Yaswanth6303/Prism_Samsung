const mongoose = require('mongoose');
const { User } = require('./lib/models/User');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('No URI');
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne();
  console.log('User keys:', {
    openaiKey: user.openaiKey,
    anthropicKey: user.anthropicKey,
    geminiKey: user.geminiKey,
    githubPat: user.githubPat
  });
  await mongoose.disconnect();
}
run().catch(console.error);
