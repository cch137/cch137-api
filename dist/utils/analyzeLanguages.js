"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLanguages = exports.analyzeLanguage = void 0;
function concentrate(text, targetLength) {
    const textLength = text.length;
    if (textLength <= targetLength)
        return text;
    let step = Math.ceil(textLength / targetLength), j = 0, k, l;
    const selected = Array.from({ length: textLength }).map((v, i) => i % step === 0 ? (j++, true) : false);
    const remainder = targetLength - j;
    if (remainder !== 0) {
        step = Math.ceil(textLength / remainder);
        for (let i = 0; i < remainder; i++) {
            j = i * step + Math.ceil(step / 2), k = 0, l = 0;
            while (Math.abs(l) < textLength) {
                if (l >= 0 && !selected[l]) {
                    selected[l] = true;
                    break;
                }
                k = k >= 0 ? -(k + 1) : k = -k;
                l = j + k;
            }
        }
    }
    return text.split('').filter((v, i) => selected[i]).join('');
}
const languageCodeRanges = {
    en: [[0x0000, 0x007F]],
    zh: [[0x4E00, 0x9FFF], [0x3400, 0x4DBF], [0x20000, 0x2A6DF], [0x2A700, 0x2B73F], [0x2B740, 0x2B81F]],
    ja: [[0x3040, 0x309F], [0x30A0, 0x30FF], [0x31F0, 0x31FF], [0x1B000, 0x1B0FF], [0x1F200, 0x1F2FF]],
    ko: [[0xAC00, 0xD7AF]],
    ru: [[0x0400, 0x04FF], [0x0500, 0x052F]], // Russian
    // Add more languages and their corresponding Unicode ranges as needed
};
function analyzeLanguages(text, sampleProportion = 0.1, minSampleSize = 100, maxSampleSize = 1000) {
    const selectedCharacters = concentrate(text.replace(/\s/g, ''), Math.floor(Math.min(maxSampleSize, Math.max(minSampleSize, text.length * sampleProportion)))).split('');
    const languageDistribution = {};
    let detectedTotal = 0, detected;
    for (const character of selectedCharacters) {
        detected = false;
        for (const languageCode in languageCodeRanges) {
            for (const characterRange of languageCodeRanges[languageCode]) {
                if (character.charCodeAt(0) >= characterRange[0] && character.charCodeAt(0) <= characterRange[1]) {
                    if (languageCode in languageDistribution)
                        languageDistribution[languageCode]++;
                    else
                        languageDistribution[languageCode] = 1;
                    detectedTotal++;
                    detected = true;
                    break;
                }
            }
            if (detected)
                break;
        }
    }
    for (const languageCode in languageDistribution)
        languageDistribution[languageCode] /= detectedTotal;
    return languageDistribution;
}
exports.analyzeLanguages = analyzeLanguages;
function analyzeLanguage(text, sampleProportion = 0.1, minSampleSize = 100, maxSampleSize = 1000) {
    const data = analyzeLanguages(text, sampleProportion, minSampleSize, maxSampleSize);
    let language = null, v = 0;
    for (const languageCode in data) {
        const u = data[languageCode];
        if (u > v)
            language = languageCode, v = u;
    }
    return language || 'en'; // default language is en
}
exports.analyzeLanguage = analyzeLanguage;
