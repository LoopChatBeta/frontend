import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Sandbox } from '@e2b/code-interpreter';

async function main() {
  console.log('Creating FC Sandbox...');
  
  const sbx = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    domain: process.env.E2B_DOMAIN,
    timeoutMs: 300_000,
  });

  try {
    console.log(`✅ Sandbox created: ${sbx.sandboxId}`);
    
    const result = await sbx.commands.run('echo "FC Sandbox is working!"');
    console.log(result.stdout.trim());
    
  } finally {
    await sbx.kill();
    console.log('Sandbox destroyed');
  }
}

main().catch(console.error);