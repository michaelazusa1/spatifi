const BASE_URL = "https://m.youtube.com";

var gl = "US";
var hl = "en";

function geturl(key, type) {
  const id = encodeURI(key);
  let url;
  switch (type) {
    case 1:
      //videos
      url = `${BASE_URL}/results?search_query=${id}&app=desktop&sp=EgIQAQ%253D%253D`;
      break;
    case 2:
      //playlist
      url = `${BASE_URL}/results?search_query=${id}&app=desktop&sp=EgIQAw%253D%253D`;
      break;

    default:
      url = `${BASE_URL}/results?search_query=${id}&app=desktop`;
      break;
  }
  return {
    data: {
      method: "get",
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148 Safari/604.1",
      },
    },
    function: "getSearchHTMLPage",
  };
}

function loadMore(token) {
  return {
    data: {
      method: "post",
      url: `${BASE_URL}/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148 Safari/604.1",
        "Content-Type": "application/json",
      },
      data: JSON.stringify(token),
    },
    function: "getSearchMorePage",
  };
}

function getSearchHTMLPage(body, _gl, _hl) {
  if (_gl) {
    gl = _gl.toUpperCase();
  }
  if (_hl) {
    hl = _hl.toLowerCase();
  }
  let data = findJSON(
    "search.html",
    "search_response",
    body,
    /\bytInitialData\s*=\s*{/,
    "</script>",
    "{"
  );
  return getSearchJson(data);
}

function getSearchMorePage(body) {
  let data = JSON.parse(body);
  return getSearchJson(data);
}

function findJSON(source, varName, body, left, right, prependJSON) {
  let jsonStr = between(body, left, right);
  if (!jsonStr) {
    throw Error(`Could not find ${varName} in ${source}`);
  }
  let cutString = cutAfterJSON(`${prependJSON}${jsonStr}`);
  if (!cutString) {
    throw Error(`CutString ${varName} in ${source}`);
  }
  return JSON.parse(cutString);
  // return parseJSON(source, varName, cutAfterJSON(`${prependJSON}${jsonStr}`));
}

between = (haystack, left, right) => {
  try {
    let pos;
    if (left instanceof RegExp) {
      const match = haystack.match(left);
      if (!match) {
        return "";
      }
      pos = match.index + match[0].length;
    } else {
      pos = haystack.indexOf(left);
      if (pos === -1) {
        return "";
      }
      pos += left.length;
    }
    haystack = haystack.slice(pos);
    pos = haystack.indexOf(right);
    if (pos === -1) {
      return "";
    }
    haystack = haystack.slice(0, pos);
    return haystack;
  } catch (error) {
    throw new Error(`between : ${error.message}`);
  }
};

cutAfterJSON = (mixedJson) => {
  try {
    let open, close;
    if (mixedJson[0] === "[") {
      open = "[";
      close = "]";
    } else if (mixedJson[0] === "{") {
      open = "{";
      close = "}";
    }

    if (!open) {
      throw new Error(
        `Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`
      );
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
      isEscaped = mixedJson[i] === "\\" && !isEscaped;

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
    throw Error(
      "Can't cut unsupported JSON (no matching closing bracket found)"
    );
  } catch (error) {
    throw new Error(`cutAfterJSON : ${error.message}`);
  }
};

const jsonClosingChars = /^[)\]}'\s]+/;
function parseJSON(source, varName, json) {
  if (!json || typeof json === "object") {
    return json;
  } else {
    try {
      json = json.replace(jsonClosingChars, "");
      return JSON.parse(json);
    } catch (err) {
      throw Error(`Error parsing ${varName} in ${source}: ${err.message}`);
    }
  }
}

function getSearchJson(data) {
  var contents;
  if (data.contents) {
    contents =
      data.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer.contents;
  } else {
    contents =
      data.onResponseReceivedCommands[0].appendContinuationItemsAction
        .continuationItems;
  }

  var result = [];
  var continuation = "";

  contents.forEach((content) => {
    const itemSectionRenderer = content.itemSectionRenderer;
    if (itemSectionRenderer) {
      itemSectionRenderer.contents.forEach((item) => {
        let video = toVideo(item);
        if (video) {
          // console.log("add Video")
          result.push(video);
        } else {
          let pl = toPlaylist(item);
          if (pl) {
            // console.log("add Playlist")
            result.push(pl);
          }
        }
      });
    } else {
      if (content.continuationItemRenderer) {
        continuation =
          content.continuationItemRenderer.continuationEndpoint
            .continuationCommand.token;
      }
    }
  });

  const jsonData = {
    results: result,
    count: result.length,
    token: {
      context: {
        client: {
          hl: hl,
          gl: gl,
          remoteHost: "",
          deviceMake: "",
          deviceModel: "",
          visitorData: "",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
          clientName: "WEB",
          clientVersion: "2.20210721.00.00",
          osName: "Windows",
          osVersion: "10.0",
          originalUrl: "",
          platform: "DESKTOP",
          clientFormFactor: "UNKNOWN_FORM_FACTOR",
          browserName: "Chrome",
          browserVersion: "74.0.3729.169",
        },
        user: {
          lockedSafetyMode: "false",
        },
        request: {
          useSsl: "true",
        },
        clickTracking: {
          clickTrackingParams: "IhMIuoCinraA8gIVlJ/CCh39fwpS",
        },
      },
      continuation: continuation,
    },
  };
  return jsonData;
}

function toVideo(item) {
  try {
    var videoRenderer = item.videoRenderer;
    if (videoRenderer === undefined) {
      return null;
    }
    const {
      title,
      longBylineText: { runs },
      thumbnail,
      videoId,
      lengthText: { simpleText: time },
    } = videoRenderer;

    return {
      type: 0,
      title: title.runs[0].text,
      description: runs[0] ? runs[0].text : "",
      image: thumbnail.thumbnails.slice(-1)[0].url,
      videoId,
      time: time,
    };
  } catch (error) {
    console.log("toVideo", error);
    return null;
  }
}

function toPlaylist(item) {
  try {
    var pl = item.playlistRenderer;
    if (pl === undefined) {
      return null;
    }
    const {
      title,
      videoCountText,
      thumbnails,
      thumbnail,
      playlistId,
      videoCountShortText,
      longBylineText,
    } = pl;
    return {
      type: 1,
      title: title.simpleText,
      image: thumbnails
        ? thumbnails[0].thumbnails.slice(-1)[0].url
        : thumbnail.thumbnails.slice(-1)[0].url,
      playlistId,
      count: videoCountShortText
        ? videoCountShortText.runs[0].text
        : videoCountText.runs[0].text,
      description: longBylineText.simpleText
        ? longBylineText.simpleText
        : longBylineText.runs[0].text,
    };
  } catch (error) {
    console.log("toPlaylist", error);
    return null;
  }
}

