function init(videoId, quality) {
  let clientName = "ANDROID"; // or  IOS
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
  const videoQualities = [
    "tiny",
    "small",
    "medium",
    "large",
    "hd720",
    "hd1080",
    "hd1440",
    "hd2160",
    "highres",
  ];
  const videoType = "video/mp4";
  const audioType = "audio/mp4";

  let json = JSON.parse(data);
  let streamingData = json.streamingData;
  let { formats, adaptiveFormats } = streamingData;

  // collect link videos / audios
  let videoObject = {};
  let audios = [];
  for (let i = 0; i < formats.length; i++) {
    const item = formats[i];
    const mimeType = item["mimeType"];
    const quality = item["quality"];

    if (mimeType != undefined && mimeType.startsWith(videoType)) {
      if (videoObject[quality] == undefined) {
        videoObject[quality] = item;
      }
    }
    if (mimeType != undefined && mimeType.startsWith(audioType)) {
      audios.push(item);
    }
  }

  for (let i = 0; i < adaptiveFormats.length; i++) {
    const item = adaptiveFormats[i];
    const mimeType = item["mimeType"];
    const quality = item["quality"];

    if (mimeType != undefined && mimeType.startsWith(videoType)) {
      if (videoObject[quality] == undefined) {
        videoObject[quality] = item;
      }
    }
    if (mimeType != undefined && mimeType.startsWith(audioType)) {
      audios.push(item);
    }
  }

  // get an audio has the highest bit rate
  audios = audios.sort((a, b) => b.bitrate - a.bitrate);
  let audio = audios.length > 0 ? audios[0] : undefined;

  // sort videos by quality
  let videos = [];
  for (let i = 0; i < videoQualities.length; i++) {
    const quality = videoQualities[i];
    if (videoObject[quality] != undefined) {
      videos.push(videoObject[quality]);
    }
  }

  const newVideos = videos.map(convertVideo);
  const newAudio = convertAudio(audio);

  console.log("newVideos\n");
  console.log(JSON.stringify(newVideos));

  console.log("newAudio\n");
  console.log(JSON.stringify(newAudio));

  return {
    videos: newVideos,
    audio: newAudio,
  };
}

function convertVideo(a) {
  return {
    itag: a.itag,
    url: a.url,
    mimeType: a.mimeType,
    bitrate: a.bitrate,
    width: a.width,
    height: a.height,
    contentLength: a.contentLength,
    quality: a.quality,
    qualityLabel: a.qualityLabel,
  };
}

function convertAudio(a) {
  return {
    itag: a.itag,
    url: a.url,
    mimeType: a.mimeType,
    bitrate: a.bitrate,
    contentLength: a.contentLength,
    quality: a.quality,
    audioQuality: a.audioQuality,
  };
}
