function init(videoId) {
  let clientName = "ANDROID"; // or  IOS
  let data = {
    method: "post",
    url: "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
      Host: "www.youtube.com",
      "content-type": "application/json",
      Referer: `https://youtube.com/watch?v=${videoId}`,
    },
    data: JSON.stringify({
      context: {
        client: {
          hl: "en",
          gl: "VN",
          clientName: clientName,
          clientVersion: "17.10.35",
        },
      },
      videoId: videoId,
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

  // console.log(JSON.stringify(formats));

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

  // sort videos by quality
  let videos = [];
  for (let i = 0; i < videoQualities.length; i++) {
    const quality = videoQualities[i];
    if (videoObject[quality] != undefined) {
      videos.push(videoObject[quality]);
    }
  }

  return {
    videos: videos.map(convertVideo),
    audio: audios.length > 0 ? convertAudio(audios[0]) : undefined,
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
