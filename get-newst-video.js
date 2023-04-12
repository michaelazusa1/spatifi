function init() {
  return {
    data: {
      method: "post",
      url: "https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
        "Content-Type": "application/json",
        Host: "www.youtube.com",
      },
      data: JSON.stringify({
        context: {
          capabilities: {},
          client: {
            clientName: "WEB",
            clientVersion: "2.20220808.01.00",
            gl: "US",
            hl: "en",
          },
        },
        browseId: "UC-9-kyTW8ZkZNDHQJ6FgpwQ",
      }),
    },
    function: "getVideoNewst",
  };
}
function getVideoNewst(data) {
  var result = [];
  var contents;
  let jsonData = JSON.parse(data);
  var itemSectionRenderer =
    jsonData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
      .sectionListRenderer;
  if (itemSectionRenderer) {
    contents = itemSectionRenderer.contents;
  }
  contents.forEach((content) => {
    const itemSectionRenderer = content.itemSectionRenderer;
    if (itemSectionRenderer) {
      itemSectionRenderer.contents[0].shelfRenderer.content.horizontalListRenderer.items.forEach(
        (item) => {
          var isCompactStationRenderer;
          isCompactStationRenderer = item.compactStationRenderer;
          if (isCompactStationRenderer) {
            let dataMedia = toMediaCompactStation(item);
            result.push(dataMedia);
          }
          var isGridVideoRenderer;
          isGridVideoRenderer = item.gridVideoRenderer;
          if (isGridVideoRenderer) {
            let dataVideo = toMediaGridVideo(item);
            result.push(dataVideo);
          }
          var isGridPlaylistRenderer;
          isGridPlaylistRenderer = item.gridPlaylistRenderer;
          if (isGridPlaylistRenderer) {
            let dataPlaylist = toMediaGridPlaylist(item);
            result.push(dataPlaylist);
          }
        }
      );
    }
  });
  const jsonResultData = {
    results: result,
    count: result.length,
  };
  return jsonResultData;
}
function toMediaCompactStation(e) {
  try {
    const {
      compactStationRenderer: {
        title: t,
        description: n,
        videoCountText: { runs: k },
        thumbnail: i,
        navigationEndpoint: { watchEndpoint: o },
      },
    } = e;
    return {
      title: t.simpleText,
      description: n.simpleText,
      image: i.thumbnails.slice(-1)[0].url,
      videoId: o.videoId,
      playlistId: o.playlistId,
    };
  } catch (error) {
    return error;
  }
}
function toMediaGridVideo(e) {
  try {
    const {
      gridVideoRenderer: {
        title: t,
        shortBylineText: { runs: n },
        videoCountText: k,
        thumbnail: i,
        videoId: o,
      },
    } = e;
    return {
      title: t.simpleText,
      description: n[0] ? n[0].text : "",
      image: i.thumbnails.slice(-1)[0].url,
      videoId: o,
      playlistId: "",
    };
  } catch (error) {
    return error;
  }
}
function toMediaGridPlaylist(e) {
  try {
    const {
      gridPlaylistRenderer: {
        title: { runs: t },
        shortBylineText: { runs: n },
        videoCountText: k,
        thumbnail: i,
        playlistId: o,
        navigationEndpoint: { watchEndpoint: m },
      },
    } = e;
    var name = t[0] ? t[0].text : "";
    return {
      title: t[0] ? t[0].text : "",
      description: n[0] ? n[0].text : "",
      image: i.thumbnails.slice(-1)[0].url,
      videoId: m.videoId,
      playlistId: o,
    };
  } catch (error) {
    return error;
  }
}
