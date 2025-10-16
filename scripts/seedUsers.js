const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const users = [
  {
    username: 'Shams',
    password: 'sarismylife',
    profilePic: '/profile-pics/shams.jpg'
  },
  {
    username: 'Mango',
    password: 'shamsismysoul@!',
    profilePic: '/profile-pics/mango.jpg'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);
    }

    console.log('\n✅ Successfully seeded users!');
    console.log('\nUsers created:');
    console.log('1. Username: Shams / Password: sarismylife');
    console.log('2. Username: Mango / Password: shamsismysoul@!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();

