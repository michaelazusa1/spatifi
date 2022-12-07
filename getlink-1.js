const BASE_URL = 'https://www.youtube.com';

let ncodeFn;

function geturl(id) {
    return {
        url: `${BASE_URL}/watch?v=${id}&app=desktop`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
        }
    }
}

function getWatchHTMLPage(body) {
    let info = { page: 'watch' };
    try {
        info.player_response = findJSON('watch.html', 'player_response',
            body, /\bytInitialPlayerResponse\s*=\s*\{/i, '</script>', '{');
    } catch (err) {
        let args = findJSON('watch.html', 'player_response', body, /\bytplayer\.config\s*=\s*{/, '</script>', '{');
        info.player_response = findPlayerResponse('watch.html', args);
    }
    // info.response = findJSON('watch.html', 'response', body, /\bytInitialData("\])?\s*=\s*\'/, "';", '');
    info.html5player = getHTML5player(body);
    return {
        html5player: info.html5player ? `${BASE_URL}${info.html5player}` : 'https://www.youtube.com/yts/jsbin/player-vflUPJQPD/en_US/base.js',
        formats: parseFormats(info.player_response)
    };
};

function findPlayerResponse(source, info) {
    const player_response = info && (
        (info.args && info.args.player_response) ||
        info.player_response || info.playerResponse || info.embedded_player_response);
    return parseJSON(source, 'player_response', player_response);
};

function findJSON(source, varName, body, left, right, prependJSON) {
    let jsonStr = between(body, left, right);
    if (!jsonStr) {
        throw Error(`Could not find ${varName} in ${source}`);
    }
    return parseJSON(source, varName, cutAfterJSON(`${prependJSON}${jsonStr}`));
};

function getHTML5player(body) {
    let html5playerRes =
        /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/
            .exec(body);
    return html5playerRes ? html5playerRes[1] || html5playerRes[2] : null;
};

const jsonClosingChars = /^[)\]}'\s]+/;
function parseJSON(source, varName, json) {
    if (!json || typeof json === 'object') {
        return json;
    } else {
        try {
            json = json.replace(jsonClosingChars, '');
            return JSON.parse(json);
        } catch (err) {
            throw Error(`Error parsing ${varName} in ${source}: ${err.message}`);
        }
    }
};

const parseFormats = player_response => {
    let formats = [];
    if (player_response && player_response.streamingData) {
        formats = formats
            .concat(player_response.streamingData.formats || [])
            .concat(player_response.streamingData.adaptiveFormats || []);
    }
    return formats;
};

between = (haystack, left, right) => {
    let pos;
    if (left instanceof RegExp) {
        const match = haystack.match(left);
        if (!match) { return ''; }
        pos = match.index + match[0].length;
    } else {
        pos = haystack.indexOf(left);
        if (pos === -1) { return ''; }
        pos += left.length;
    }
    haystack = haystack.slice(pos);
    pos = haystack.indexOf(right);
    if (pos === -1) { return ''; }
    haystack = haystack.slice(0, pos);
    return haystack;
};

cutAfterJSON = mixedJson => {
    let open, close;
    if (mixedJson[0] === '[') {
        open = '[';
        close = ']';
    } else if (mixedJson[0] === '{') {
        open = '{';
        close = '}';
    }

    if (!open) {
        throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`);
    }

    // States if the loop is currently in a string
    let isString = false;

    // States if the current character is treated as escaped or not
    let isEscaped = false;

    // Current open brackets to be closed
    let counter = 0;

    let i;
    for (i = 0; i < mixedJson.length; i++) {
        // Toggle the isString boolean when leaving/entering string
        if (mixedJson[i] === '"' && !isEscaped) {
            isString = !isString;
            continue;
        }

        // Toggle the isEscaped boolean for every backslash
        // Reset for every regular character
        isEscaped = mixedJson[i] === '\\' && !isEscaped;

        if (isString) continue;

        if (mixedJson[i] === open) {
            counter++;
        } else if (mixedJson[i] === close) {
            counter--;
        }

        // All brackets have been closed, thus end of JSON is reached
        if (counter === 0) {
            // Return the cut JSON
            return mixedJson.substr(0, i + 1);
        }
    }

    // We ran through the whole string and ended up with an unclosed bracket
    throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
};

function decipherFormats(formats, tokens) {
    let decipheredFormats = {};
    for (let index = 0; index < formats.length; index++) {
        const format = formats[index];
        let cipher = format.signatureCipher || format.cipher;
        if (cipher) {
            Object.assign(format, parse(cipher));
            delete format.signatureCipher;
            delete format.cipher;
        }
        if (format.s) {
            format.s = format.s.replace(/\%3D/g, '=');
        }

        const sig = tokens && format.s ? decipher(tokens, format.s) : null;
        format.url = setURL(format, sig);
        //cut n
        let nOld = between(format.url, '&n=', "&")
        let n = ncodeFn(nOld)
        format.url = format.url.replace(`&n=${nOld}&`, `&n=${n}&`)
        decipheredFormats[format.itag] = format;
    }
    return decipheredFormats;
};


const setURL = (format, sig) => {

    let decodedUrl;
    if (format.url) {
        decodedUrl = format.url;
    } else {
        return "";
    }

    try {
        decodedUrl = decodeURIComponent(decodedUrl);
    } catch (err) {
        console.log("setURL err", err)
        return "";
    }

    if (!decodedUrl.includes('&ratebypass=')) {
        decodedUrl = decodedUrl + '&ratebypass=yes';
    }

    if (sig) {
        // When YouTube provides a `sp` parameter the signature `sig` must go
        // into the parameter it specifies.
        // See https://github.com/fent/node-ytdl-core/issues/417
        let signature = format.sp || 'signature'
        decodedUrl = decodedUrl + `&${signature}=${sig}`;
    }

    return decodedUrl;
};

/**
   * Decipher a signature based on action tokens.
   *
   * @param {Array.<string>} tokens
   * @param {string} sig
   * @returns {string}
   */
function decipher(tokens, sig) {
    sig = sig.split('');
    for (let i = 0, len = tokens.length; i < len; i++) {
        let token = tokens[i], pos;
        switch (token[0]) {
            case 'r':
                sig = sig.reverse();
                break;
            case 'w':
                pos = ~~token.slice(1);
                sig = swapHeadAndPosition(sig, pos);
                break;
            case 's':
                pos = ~~token.slice(1);
                sig = sig.slice(pos);
                break;
            case 'p':
                pos = ~~token.slice(1);
                sig.splice(0, pos);
                break;
        }
    }
    return sig.join('');
};


/**
 * Swaps the first element of an array with one of given position.
 *
 * @param {Array.<Object>} arr
 * @param {number} position
 * @returns {Array.<Object>}
 */
swapHeadAndPosition = (arr, position) => {
    const first = arr[0];
    arr[0] = arr[position % arr.length];
    arr[position] = first;
    return arr;
};


const jsVarStr = '[a-zA-Z_\\$][a-zA-Z_0-9]*';
const jsSingleQuoteStr = `'[^'\\\\]*(:?\\\\[\\s\\S][^'\\\\]*)*'`;
const jsDoubleQuoteStr = `"[^"\\\\]*(:?\\\\[\\s\\S][^"\\\\]*)*"`;
const jsQuoteStr = `(?:${jsSingleQuoteStr}|${jsDoubleQuoteStr})`;
const jsKeyStr = `(?:${jsVarStr}|${jsQuoteStr})`;
const jsPropStr = `(?:\\.${jsVarStr}|\\[${jsQuoteStr}\\])`;
const jsEmptyStr = `(?:''|"")`;
const reverseStr = ':function\\(a\\)\\{' +
    '(?:return )?a\\.reverse\\(\\)' +
    '\\}';
const sliceStr = ':function\\(a,b\\)\\{' +
    'return a\\.slice\\(b\\)' +
    '\\}';
const spliceStr = ':function\\(a,b\\)\\{' +
    'a\\.splice\\(0,b\\)' +
    '\\}';
const swapStr = ':function\\(a,b\\)\\{' +
    'var c=a\\[0\\];a\\[0\\]=a\\[b(?:%a\\.length)?\\];a\\[b(?:%a\\.length)?\\]=c(?:;return a)?' +
    '\\}';
const actionsObjRegexp = new RegExp(
    `var (${jsVarStr})=\\{((?:(?:${jsKeyStr}${reverseStr}|${jsKeyStr}${sliceStr}|${jsKeyStr}${spliceStr}|${jsKeyStr}${swapStr
    }),?\\r?\\n?)+)\\};`);
const actionsFuncRegexp = new RegExp(`${`function(?: ${jsVarStr})?\\(a\\)\\{` +
    `a=a\\.split\\(${jsEmptyStr}\\);\\s*` +
    `((?:(?:a=)?${jsVarStr}`}${jsPropStr
    }\\(a,\\d+\\);)+)` +
    `return a\\.join\\(${jsEmptyStr}\\)` +
    `\\}`);
const reverseRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${reverseStr}`, 'm');
const sliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${sliceStr}`, 'm');
const spliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${spliceStr}`, 'm');
const swapRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${swapStr}`, 'm');


/**
 * Extracts the actions that should be taken to decipher a signature.
 *
 * This searches for a function that performs string manipulations on
 * the signature. We already know what the 3 possible changes to a signature
 * are in order to decipher it. There is
 *
 * * Reversing the string.
 * * Removing a number of characters from the beginning.
 * * Swapping the first character with another position.
 *
 * Note, `Array#slice()` used to be used instead of `Array#splice()`,
 * it's kept in case we encounter any older html5player files.
 *
 * After retrieving the function that does this, we can see what actions
 * it takes on a signature.
 *
 * @param {string} body
 * @returns {Array.<string>}
 */
extractActions = body => {
    getn(body)
    const objResult = actionsObjRegexp.exec(body);
    const funcResult = actionsFuncRegexp.exec(body);
    if (!objResult || !funcResult) { return null; }

    const obj = objResult[1].replace(/\$/g, '\\$');
    const objBody = objResult[2].replace(/\$/g, '\\$');
    const funcBody = funcResult[1].replace(/\$/g, '\\$');

    let result = reverseRegexp.exec(objBody);
    const reverseKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');
    result = sliceRegexp.exec(objBody);
    const sliceKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');
    result = spliceRegexp.exec(objBody);
    const spliceKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');
    result = swapRegexp.exec(objBody);
    const swapKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');

    const keys = `(${[reverseKey, sliceKey, spliceKey, swapKey].join('|')})`;
    const myreg = `(?:a=)?${obj
        }(?:\\.${keys}|\\['${keys}'\\]|\\["${keys}"\\])` +
        `\\(a,(\\d+)\\)`;
    const tokenizeRegexp = new RegExp(myreg, 'g');
    const tokens = [];
    while ((result = tokenizeRegexp.exec(funcBody)) !== null) {
        let key = result[1] || result[2] || result[3];
        switch (key) {
            case swapKey:
                tokens.push(`w${result[4]}`);
                break;
            case reverseKey:
                tokens.push('r');
                break;
            case sliceKey:
                tokens.push(`s${result[4]}`);
                break;
            case spliceKey:
                tokens.push(`p${result[4]}`);
                break;
        }
    }
    return tokens;
};


/////query-string
function parse(query) {

    const formatter = parserForArrayFormat();
    // Create an object with no prototype
    const ret = Object.create(null);

    if (typeof query !== 'string') {
        return ret;
    }

    query = query.trim().replace(/^[?#&]/, '');

    if (!query) {
        return ret;
    }

    for (const param of query.split('&')) {
        if (param === '') {
            continue;
        }

        let [key, value] = splitOnFirst(param.replace(/\+/g, ' '), '=');
        formatter(decode(key), value, ret);
    }

    for (const key of Object.keys(ret)) {
        const value = ret[key];

        if (typeof value === 'object' && value !== null) {
            for (const k of Object.keys(value)) {
                value[k] = parseValue(value[k]);
            }
        } else {
            ret[key] = parseValue(value);
        }
    }
    return ret;
}

function decode(value) {
    encodedURI = value.replace(/\+/g, ' ');
    encodedURI = encodedURI.replace(/\%3D/g, '=');

    // Try the built in decoder first
    return decodeURIComponent(encodedURI);
    //      return decodeComponent(value);
}

function splitOnFirst(string, separator) {
    if (!(typeof string === 'string' && typeof separator === 'string')) {
        throw new TypeError('Expected the arguments to be of type `string`');
    }

    if (string === '' || separator === '') {
        return [];
    }

    const separatorIndex = string.indexOf(separator);

    if (separatorIndex === -1) {
        return [];
    }

    return [
        string.slice(0, separatorIndex),
        string.slice(separatorIndex + separator.length)
    ];
}


function parseValue(value) {
    if (!Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
        value = Number(value);
    } else if (value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
        value = value.toLowerCase() === 'true';
    }

    return value;
}


function parserForArrayFormat() {
    return (key, value, accumulator) => {
        if (accumulator[key] === undefined) {
            accumulator[key] = value;
            return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
    };
}

function pinch(body, start, end, snip, enip, empty, truncate) {
    let extract = empty;
    let spos = body.indexOf(start);
    let slen = start.length;
    if (spos >= 0) {
        let next = body.substr(spos + slen - snip);
        let epos = next.indexOf(end);
        if (epos >= 0) {
            extract = next.substr(0, epos + enip);
            if (truncate) body = body.substr(spos + slen - snip + epos + enip);
        } else {
            extract = body.substr(spos + slen - snip);
            if (truncate) body = '';
        }
    } else {
        if (truncate) body = '';
    }
    return extract;
}

function block(body, start, snip, open, close, empty, truncate) {
    let extract = empty;
    let spos = body.indexOf(start);
    let slen = start.length;
    if (spos >= 0) {
        let pos = spos + slen - snip;
        let done = false;
        let level = 0;
        extract = start.substr(0, slen - snip);
        while (!done) {
            switch (body[pos]) {
                case open:
                    level++;
                    break;
                case close:
                    level--;
                    if (!level) done = true;
                    break;
            }
            extract += body[pos];
            pos++;
            if (pos >= body.length) done = true;
        }
        if (truncate) body = body.substring(0, pos);
    } else {
        if (truncate) body = '';
    }
    return extract;
}

function getn(body) {
    let fname = pinch(body, '&&(b=a.get("n"))&&(b=', '(b)', 0, 0, '', false);
    if (fname.indexOf('[') !== -1) {
        fname=pinch(body,`${fname.split("[")[0]}=[`,"]",0,0,"",false);
    }
    let ffunc = fname + '=function(a)';
    ffunc = 'var ' + block(body, ffunc, 0, '{', '}', '{}', false);
    ncodeFn = new Function('ncode', ffunc + '; return ' + fname + '(ncode);');
}