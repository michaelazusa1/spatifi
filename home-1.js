function init(t, e) {
  return (
    t || (t = "US"),
    e || (e = "en"),
    {
      data: {
        method: "get",
        url: "https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ",
        headers: {
          accept: "application/json, text/plain, */*",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
          "accept-language": `${e}-${t},${e}`,
          cookie:
            "YSC=w3xk3zLXJvw; SOCS=CAISEwgDEgk0NzUxNzk1NjkaAmVuIAEaBgiAhaSZBg; VISITOR_INFO1_LIVE=EYZCNZKRQRM",
        },
      },
      function: "getHomeHTMLPage",
    }
  );
}

function getHomeHTMLPage(t) {
  return {
    data: getSearchJson(
      findJSON(
        "topHome.html",
        "HOME_response",
        t,
        /\bytInitialData\s*=\s*{/,
        "</script>",
        "{"
      )
    ),
  };
}

function findJSON(t, e, n, r, o, i) {
  let s = between(n, r, o);
  if (!s) throw Error(`Could not find ${e} in ${t}`);
  return parseJSON(t, e, cutAfterJSON(`${i}${s}`));
}
const between = (t, e, n) => {
  let r;
  if (e instanceof RegExp) {
    const n = t.match(e);
    if (!n) return "";
    r = n.index + n[0].length;
  } else {
    if (((r = t.indexOf(e)), -1 === r)) return "";
    r += e.length;
  }
  return (r = (t = t.slice(r)).indexOf(n)), -1 === r ? "" : (t = t.slice(0, r));
};
const cutAfterJSON = (t) => {
  let e, n;
  if (
    ("[" === t[0]
      ? ((e = "["), (n = "]"))
      : "{" === t[0] && ((e = "{"), (n = "}")),
    !e)
  )
    throw new Error(
      `Can't cut unsupported JSON (need to begin with [ or { ) but got: ${t[0]}`
    );
  let r,
    o = !1,
    i = !1,
    s = 0;
  for (r = 0; r < t.length; r++)
    if ('"' !== t[r] || i) {
      if (
        ((i = "\\" === t[r] && !i),
        !o && (t[r] === e ? s++ : t[r] === n && s--, 0 === s))
      )
        return t.substr(0, r + 1);
    } else o = !o;
  throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
};
const jsonClosingChars = /^[)\]}'\s]+/;

function parseJSON(t, e, n) {
  if (!n || "object" == typeof n) return n;
  try {
    return (n = n.replace(jsonClosingChars, "")), JSON.parse(n);
  } catch (n) {
    throw Error(`Error parsing ${e} in ${t}: ${n.message}`);
  }
}

function getSearchJson(t) {
  return tojson(
    t.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
      .sectionListRenderer.contents
  );
}

function tojson(t) {
  try {
    const e = t
      .map((t) => {
        const e = t.itemSectionRenderer.contents[0].shelfRenderer,
          n = toPlaylist(e.content.horizontalListRenderer.items);
        return n && n.length > 0
          ? {
              title: e.title.runs[0].text,
              playlist: n,
            }
          : null;
      })
      .filter((t) => t);
    return console.log("-----done -------"), e;
  } catch (t) {
    return [];
  }
}

function toPlaylist(t) {
  try {
    return t
      .map((t) => {
        try {
          const {
            compactStationRenderer: {
              title: e,
              thumbnail: n,
              navigationEndpoint: {
                watchPlaylistEndpoint: r,
              },
              videoCountText: o,
              description: i,
            },
          } = t;
          return {
            type: 1,
            title: e.simpleText,
            image: n.thumbnails[0].url,
            playlistId: r.playlistId,
            count: o.runs[0].text,
            description: i.simpleText,
          };
        } catch (t) {
          return null;
        }
      })
      .filter((t) => t);
  } catch (t) {
    return null;
  }
}
