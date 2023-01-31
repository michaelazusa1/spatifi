function init(e, t) {
    if ("" === t) {
        return {
            data: {
                method: "get",
                url: "https://www.youtube.com/playlist?list=" + e,
                headers: {
                    accept: "application/json, text/plain, */*",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
                    "accept-language": "",
                    cookie: "YSC=w3xk3zLXJvw; SOCS=CAISEwgDEgk0NzUxNzk1NjkaAmVuIAEaBgiAhaSZBg; VISITOR_INFO1_LIVE=EYZCNZKRQRM"
                }
            },
            function: "getVideoHTMLPage"
        }
    }
    return {
        data: {
            method: "post",
            url: "https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
            headers: {
                "content-type": "application/json",
                "x-youtube-device": "cbr=Chrome&cbrver=81.0.4044.113&ceng=WebKit&cengver=537.36&cos=Windows&cosver=10.0&cplatform=DESKTOP",
                "x-youtube-utc-offset": "0",
                accept: "application/json, text/plain, */*",
                "x-youtube-client-version": "2.20220808.01.00",
                "x-origin": "https://www.youtube.com/",
                "accept-language": "",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
                cookie: "YSC=w3xk3zLXJvw; SOCS=CAISEwgDEgk0NzUxNzk1NjkaAmVuIAEaBgiAhaSZBg; VISITOR_INFO1_LIVE=EYZCNZKRQRM"
            },
            data: JSON.stringify({
                context: {
                    capabilities: {},
                    client: {
                        clientName: "WEB",
                        clientVersion: "2.20220808.01.00",
                        experimentIds: [],
                        experimentsToken: "",
                        gl: "US",
                        hl: "en",
                        locationInfo: {
                            locationPermissionAuthorizationStatus: "LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED"
                        },
                        musicAppInfo: {
                            musicActivityMasterSwitch: "MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE",
                            musicLocationMasterSwitch: "MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE",
                            pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN"
                        },
                        utcOffsetMinutes: 420
                    },
                    request: {
                        internalExperimentFlags: [{
                            key: "force_music_enable_outertube_tastebuilder_browse",
                            value: "true"
                        }, {
                            key: "force_music_enable_outertube_playlist_detail_browse",
                            value: "true"
                        }, {
                            key: "force_music_enable_outertube_search_suggestions",
                            value: "true"
                        }],
                        sessionIndex: {}
                    },
                    user: {
                        enableSafetyMode: !1
                    }
                },
                continuation: t
            })
        },
        function: "getVideoPlaylistPage"
    }
}

function initHeader(e) {
    return {
        data: {
            method: "get",
            url: "https://www.youtube.com/playlist?list=" + e,
            headers: {
                accept: "application/json, text/plain, */*",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
                "accept-language": "",
                cookie: "YSC=w3xk3zLXJvw; SOCS=CAISEwgDEgk0NzUxNzk1NjkaAmVuIAEaBgiAhaSZBg; VISITOR_INFO1_LIVE=EYZCNZKRQRM"
            }
        },
        function: "getHeaderHTMLPage"
    }
}

function getHeaderHTMLPage(e) {
    return {
        header: getHeader(findJSON("Detail.html", "Detail_response", e, /\bytInitialData\s*=\s*{/, "<\/script>", "{"))
    }
}

function getVideoHTMLPage(e) {
    return {
        data: getSearchJson(findJSON("Detail.html", "Detail_response", e, /\bytInitialData\s*=\s*{/, "<\/script>", "{"))
    }
}

function findJSON(e, t, n, i, o, r) {
    let a = between(n, i, o);
    if (!a) throw Error(`Could not find ${t} in ${e}`);
    return parseJSON(e, t, cutAfterJSON(`${r}${a}`))
}
between = (e, t, n) => {
    let i;
    if (t instanceof RegExp) {
        const n = e.match(t);
        if (!n) return "";
        i = n.index + n[0].length
    } else {
        if (i = e.indexOf(t), -1 === i) return "";
        i += t.length
    }
    return i = (e = e.slice(i)).indexOf(n), -1 === i ? "" : e = e.slice(0, i)
}, cutAfterJSON = e => {
    let t, n;
    if ("[" === e[0] ? (t = "[", n = "]") : "{" === e[0] && (t = "{", n = "}"), !t) throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${e[0]}`);
    let i, o = !1,
        r = !1,
        a = 0;
    for (i = 0; i < e.length; i++)
        if ('"' !== e[i] || r) {
            if (r = "\\" === e[i] && !r, !o && (e[i] === t ? a++ : e[i] === n && a--, 0 === a)) return e.substr(0, i + 1)
        } else o = !o;
    throw Error("Can't cut unsupported JSON (no matching closing bracket found)")
};
const jsonClosingChars = /^[)\]}'\s]+/;

function parseJSON(e, t, n) {
    if (!n || "object" == typeof n) return n;
    try {
        return n = n.replace(jsonClosingChars, ""), JSON.parse(n)
    } catch (n) {
        throw Error(`Error parsing ${t} in ${e}: ${n.message}`)
    }
}

function getHeader(e) {
    try {
        let t = e.header.playlistHeaderRenderer,
            n = "";
        try {
            n = t.descriptionText.simpleText
        } catch (e) {
            n = t.title.simpleText
        }
        return {
            playlistId: t.playlistId,
            title: t.title.simpleText,
            count: t.numVideosText.runs[0].text,
            description: n,
            image: `https://i.ytimg.com/vi/${t.playEndpoint.watchEndpoint.videoId}/hqdefault.jpg`
        }
    } catch (t) {
        if (e.alerts.length > 0) return {
            error: 1,
            message: "not exist"
        }
    }
    return {
        error: "404",
        message: "not playlist"
    }
}

function getSearchJson(e) {
    return tojson(e.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents)
}

function tojson(e) {
    let t = "";
    return {
        videos: e.map((e => {
            const n = toVideo(e);
            if (n) return n;
            try {
                t = e.continuationItemRenderer.continuationEndpoint.continuationCommand.token
            } catch (t) {
                return e
            }
        })).filter((e => e)),
        token: t
    }
}

function toVideo(e) {
    try {
        const {
            playlistVideoRenderer: {
                title: t,
                shortBylineText: {
                    runs: n
                },
                thumbnail: i,
                videoId: o,
                lengthText: {
                    simpleText: r
                }
            }
        } = e;
        return {
            type: 0,
            title: t.runs[0].text,
            description: n[0] ? n[0].text : "",
            image: i.thumbnails.slice(-1)[0].url,
            videoId: o,
            time: r
        }
    } catch (e) {
        return null
    }
}

function getVideoPlaylistPage(e) {
    return {
        data: tojsonNext(JSON.parse(e).onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems)
    }
}

function tojsonNext(e) {
    let t = "";
    return {
        videos: e.map((e => {
            const n = toVideoNext(e);
            if (n) return n;
            try {
                t = e.continuationItemRenderer.continuationEndpoint.continuationCommand.token
            } catch (t) {
                return e
            }
        })).filter((e => e)),
        token: t
    }
}

function toVideoNext(e) {
    try {
        const {
            playlistVideoRenderer: {
                title: t,
                shortBylineText: {
                    runs: n
                },
                thumbnail: i,
                videoId: o,
                lengthText: {
                    simpleText: r
                }
            }
        } = e;
        return {
            type: 0,
            title: t.runs[0].text,
            description: n[0] ? n[0].text : "",
            image: i.thumbnails.slice(-1)[0].url,
            videoId: o,
            time: r
        }
    } catch (e) {
        return null
    }
}
