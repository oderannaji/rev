import {createServer} from '../server/index.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dataDir=await mkdtemp(join(tmpdir(),'gather-browser-test-'));
const server=await createServer({dataDir});server.listen(4174,'127.0.0.1');
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{server.closeAllConnections();server.close();await rm(dataDir,{recursive:true,force:true});process.exit(0);});
