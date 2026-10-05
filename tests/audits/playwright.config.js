import {defineConfig} from '@playwright/test';
import base from '../../playwright.config.js';

export default defineConfig({...base,testDir:'.',testMatch:'product-journey-audit.spec.js',workers:1,retries:0,timeout:120_000,
 reporter:[['list'],['./journey-audit-reporter.js']],outputDir:'../../.tmp-product-journey-audit'});
