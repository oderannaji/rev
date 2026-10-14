import { defineConfig } from '@playwright/test';
import {existsSync} from 'node:fs';
export default defineConfig({
 testDir:'./tests/e2e',fullyParallel:false,workers:1,timeout:30000,
 use:{baseURL:'http://127.0.0.1:4174',viewport:{width:1440,height:1000},headless:true,launchOptions:{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']},screenshot:'only-on-failure'},
 webServer:{command:'node scripts/e2e-server.js',url:'http://127.0.0.1:4174/api/health',reuseExistingServer:false,timeout:30000},
});
