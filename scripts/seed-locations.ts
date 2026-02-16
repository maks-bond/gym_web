import { upsertLocation } from "../lib/sessions-repo";

const LOCATIONS = [
  { locationId: "planet-fitness", name: "Planet Fitness" },
  { locationId: "work", name: "Work" },
  { locationId: "street", name: "Street" },
  { locationId: "unknown", name: "Unknown" },
];

async function run() {
  for (const location of LOCATIONS) {
    await upsertLocation(location.locationId, location.name);
    console.log(`Upserted location ${location.locationId} (${location.name})`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
