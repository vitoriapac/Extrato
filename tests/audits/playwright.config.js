import {defineConfig} from '@playwright/test';
import base from '../../playwright.config.js';

export default defineConfig({...base,testDir:'.',testMatch:'product-journey-audit.spec.js',workers:1,retries:0,timeout:120_000,
 use:{...base.use,baseURL:'http://127.0.0.1:4174'},
 webServer:{...base.webServer,url:'http://127.0.0.1:4174',env:{PORT:'4174'},reuseExistingServer:false},
 reporter:[['list'],['./journey-audit-reporter.js']],outputDir:'../../.tmp-product-journey-audit'});
