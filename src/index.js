if (process.env.VERCEL) {
  return;
}

const { startServer } = require('./server');
const bot = require('./bot');

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎵 SOUNDTRAP AUTOMATED AUDIO DOWNLOADER & HARVESTER');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Start Express Dashboard
    await startServer();

    // 2. Launch Playwright Automation Bot
    await bot.start();

    console.log('\n🟢 System running in fully automated mode.');
    console.log('👉 Dashboard: http://localhost:3000');
    console.log('Press Ctrl+C to stop the bot and server.\n');

  } catch (err) {
    console.error('❌ Fatal error during system launch:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

main();
