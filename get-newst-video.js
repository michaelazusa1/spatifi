function init() {
  return {
    data: {
      method: "post",
      url: "https://www.youtube.com/youtubei/v1/next?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
        'Host': 'www.youtube.com',
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20220808.01.00",
            visitorData: "CgtoUXRvSVV6T05GbyjT-cmhBg%3D%3D",
            gl: "US",
            hl: "en",
          },
        },
        videoId: "MSRcC626prw",
        playlistId: "RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs"
      }),
    },
    function: "getHottestTrackPage",
  };
}
function getHottestTrackPage(data) {
  var result = [];
  var contents;
  let jsonData = JSON.parse(data);
  var playlistItem =
    jsonData.contents.twoColumnWatchNextResults.playlist.playlist;
  if (playlistItem) {
    contents = playlistItem.contents;
  }
  contents.forEach((content) => {
    let video = toplaylistPanelVideoRenderer(content);
    result.push(video);
  });
  const jsonResultData = {
    results: result,
    count: result.length,
  };
  return jsonResultData;
}
function toplaylistPanelVideoRenderer(e) {
  try {
    const {
      playlistPanelVideoRenderer: {
        title: t,
        longBylineText: { runs: n },
        thumbnail: i,
        navigationEndpoint: { watchEndpoint: o },
        videoId: v,
      },
    } = e;
    return {
      title: t.simpleText,
      description: n[0] ? n[0].text : "",
      image: i.thumbnails.slice(-1)[0].url,
      videoId: v,
      playlistId: o.playlistId,
    };
  } catch (error) {
    return error;
  }
}
