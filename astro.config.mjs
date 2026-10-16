import {defineConfig} from 'astro/config';
export default defineConfig({
  output:'static',
  trailingSlash:'always',
  devToolbar:{enabled:false},
  server:{host:'127.0.0.1',port:3000},
  i18n:{locales:['zh','en'],defaultLocale:'en',routing:{prefixDefaultLocale:true}},
});
