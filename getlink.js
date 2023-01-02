var qualityVideo = 0;

function init(videoId, quality) {
  let clientName = "ANDROID";
  qualityVideo = parseInt(quality);
  if (qualityVideo === 0 || qualityVideo === 3) {
    clientName = "IOS";
  }
  let data = {
    method: "post",
    url: "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
      Host: "www.youtube.com",
      "content-type": "application/json",
    },
    data: JSON.stringify({
      uri: "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      context: {
        client: {
          clientName: clientName,
          clientVersion: "16.20",
        },
      },
      videoId: videoId,
      playbackContext: {
        contentPlaybackContext: {
          html5Preference: "HTML5_PREF_WANTS",
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  };
  return {
    data,
    function: "getVideoHTMLPage",
  };
}

function getVideoHTMLPage(data) {
  let json = JSON.parse(data);
  if (qualityVideo === 0) {
    let hlsManifestUrl = json.streamingData.hlsManifestUrl;
    return {
      data: {
        url: hlsManifestUrl,
      },
    };
  }
  if (qualityVideo === 3) {
    let hlsManifestUrl = json.streamingData.hlsManifestUrl;
    if (hlsManifestUrl) {
      return {
        data: {
          method: "get",
          url: hlsManifestUrl,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
            Host: "www.youtube.com",
            "content-type": "application/json",
          },
        },
        function: "getAudio",
      };
    }
  }

  let adaptiveFormats = json.streamingData.formats;

  let url = "";
  let dic = {};
  adaptiveFormats.forEach((element) => {
    dic[element.itag] = element.url;
  });
  if (qualityVideo === 1) {
    url = dic["22"];
    if (!url) {
      url = dic["18"];
    }
    if (!url) {
      url = dic["17"];
    }
  }

  if (qualityVideo === 2) {
    url = dic["18"];
    if (!url) {
      url = dic["17"];
    }
    if (!url) {
      url = dic["22"];
    }
  }

  return {
    data: {
      url: url,
    },
  };
}

function getAudio(data) {
  let array = data.split('#EXT-X-MEDIA:URI="');
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if (element.includes("TYPE=AUDIO")) {
      let url = element.split('"')[0];
      return {
        data: {
          url: url,
        },
      };
    }
  }
  return {
    data: {
      url: "",
    },
  };
}
