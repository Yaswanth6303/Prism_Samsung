const fs = require('fs');
let content = fs.readFileSync('components/StreakDisplay.tsx', 'utf8');
content = content.replace(
  '<Flame className="w-6 h-6 text-orange-500" />',
  '<Flame className={`w-6 h-6 ${currentStreak > 0 ? \\'text-orange-500\\' : \\'text-gray-400\\'}`} />'
);
content = content.replace(
  '<p className="text-3xl font-bold text-orange-600">{currentStreak}</p>',
  '<p className={`text-3xl font-bold ${currentStreak > 0 ? \\'text-orange-600\\' : \\'text-gray-500\\'}`}>{currentStreak}</p>'
);
fs.writeFileSync('components/StreakDisplay.tsx', content);
console.log('Updated StreakDisplay.tsx');
