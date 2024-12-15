const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generatedStrings = new Set();

function generateShortStrings() {
    while (generatedStrings.size < 10) {
        const newString = generateBase62String(6); // Adjust length as needed
        generatedStrings.add(newString);
    }
}

function getTinyUrl(url) {
    if (generatedStrings.size === 0) {
        generateShortStrings();
        console.log(generatedStrings);
    }
    const id = getNextStringAndClear(generatedStrings);
    const tinyUrl = `http://tinyweb.io/${id}`;
    return tinyUrl;
}

function generateBase62String(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * base62Chars.length);
        result += base62Chars[randomIndex];
    }
    return result.toLowerCase();
}

function getNextStringAndClear(set) {
    const iterator = set.values();
    const firstValue = iterator.next().value;
    set.delete(firstValue);
    return firstValue;
}

module.exports = {
    generateShortStrings,
    getTinyUrl,
    generatedStrings
};