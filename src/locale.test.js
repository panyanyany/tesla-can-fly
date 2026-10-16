import {test} from 'node:test';
import assert from 'node:assert/strict';
import {supportedLanguage,preferredLanguage,languageSuggestion} from './locale.js';
test('offer browser language A when page language is B, including a saved B',()=>{
 assert.equal(languageSuggestion('en',['zh-CN','en-US']),'zh');
 assert.equal(languageSuggestion('zh',['en-GB','zh-TW']),'en');
});
test('do not offer a switch when current language matches or preference is unsupported',()=>{
 assert.equal(languageSuggestion('en',['en-US','zh-CN']),null);
 assert.equal(languageSuggestion('en',['ja-JP']),null);
 assert.equal(preferredLanguage(['fr-FR','zh-HK','en-US']),'zh');
 assert.equal(supportedLanguage('english'),null);
});
