export function supportedLanguage(value='') {
  if(/^zh(?:-|$)/i.test(value))return 'zh';
  if(/^en(?:-|$)/i.test(value))return 'en';
  return null;
}
export function preferredLanguage(languages=[]) {
  return languages.map(supportedLanguage).find(Boolean)||null;
}
export function languageSuggestion(current,languages=[]) {
  const preferred=preferredLanguage(languages);
  return preferred&&preferred!==current?preferred:null;
}
