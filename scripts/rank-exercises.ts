import { rankExercisesByUsage } from "../lib/sessions-repo";

const USER_ID = process.env.USER_ID || "me";

async function run() {
  const { total, updated, ranked } = await rankExercisesByUsage(USER_ID);

  console.log(`Ranked ${total} exercises by frequency (${updated} changed).`);
  for (const item of ranked.slice(0, 20)) {
    console.log(`${item.name} -> ${item.usageCount ?? 0}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
