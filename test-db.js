const mongoose = require('mongoose');
const { User } = require('./lib/models/User');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('No URI');
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne();
  if (!user) {
    console.log('No user found')
    await mongoose.disconnect();
    return
  }

  console.log('User keys (redacted):', {
    hasOpenaiKey: Boolean(user.openaiKey),
    hasAnthropicKey: Boolean(user.anthropicKey),
    hasGeminiKey: Boolean(user.geminiKey),
    hasGithubPat: Boolean(user.githubPat),
  });
  await mongoose.disconnect();
}
run().catch(console.error);
