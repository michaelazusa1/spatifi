var qualityVideo = 0;

function init(videoId, quality) {
  let clientName = "ANDROID";
  
  qualityVideo = parseInt(quality);
  if (qualityVideo === 0 || qualityVideo === 3) {
    clientName = "IOS";
  }
    
  let data = {
    method: "post",
    url: "https://music.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
      Host: "music.youtube.com",
      "content-type": "application/json",
    },
    data: qualityVideo === 0 ? JSON.stringify({
      "context": {
        "client": {
          "gl": "US",
          "clientName": clientName,
          "hl": "en",
          "clientVersion": "16.49"
        }
      },
      "videoId": videoId,
      "racyCheckOk": true,
      "contentCheckOk": true
    }) : JSON.stringify({
        "context": {
            "client": {
              "gl": "US",
              "hl": "en",
              "androidSdkVersion": 31,
              "clientName": "ANDROID",
              "clientVersion": "17.31.35"
            }
          },
          "videoId": videoId,
          "contentCheckOk": true,
          "racyCheckOk": true,
          "params": "8AEB"
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

  //console.log(JSON.stringify(json));

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
