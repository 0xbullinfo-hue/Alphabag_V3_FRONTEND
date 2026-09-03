import { pathToFileURL } from 'url';

async function main() {
  const storeModule = await import(pathToFileURL('C:/Users/1/repos/alphabag_v3_backend/src/services/storeService.js').href);
  const { store } = storeModule;
  const admins = await store.findMany('admins', {});
  console.log('=== ADMIN ACCOUNTS IN BACKEND DB ===');
  console.log('Count:', admins.length);
  console.log(JSON.stringify(admins, null, 2));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
