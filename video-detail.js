const BASE_URL = 'https://www.youtube.com/watch?v=';

function geturl(id) {
    return {
        data: {
            method: 'get',
            url: BASE_URL + id,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15'
            }
        },
        function: "getVideoHTMLPage"
    }
}

function getVideoHTMLPage(body, id) {
    let data = findJSON('detail.html', 'detail_response', body, /\bytInitialData\s*=\s*{/, '</script>', '{');
    let videoDetail = data.playerOverlays.playerOverlayRenderer.videoDetails.playerOverlayVideoDetailsRenderer;
    
    let json = {
        title: videoDetail.title.simpleText,
        subtitle: videoDetail.subtitle.runs.length > 0 ? videoDetail.subtitle.runs[0].text : '',
        videoId: id,
        image: `https://img.youtube.com/vi/${id}/mqdefault.jpg`
    };

    return json;
}

function findJSON(source, varName, body, left, right, prependJSON) {
    let jsonStr = between(body, left, right);
    if (!jsonStr) {
        throw Error(`Could not find ${varName} in ${source}`);
    }
    return parseJSON(source, varName, cutAfterJSON(`${prependJSON}${jsonStr}`));
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
