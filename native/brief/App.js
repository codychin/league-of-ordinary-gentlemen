import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  createContext,
} from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
  AppState,
  useColorScheme,
  StatusBar,
  RefreshControl,
  Animated,
  AccessibilityInfo,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoView, useVideoPlayer } from "expo-video";
import { BlurView } from "expo-blur";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { WebView } from "react-native-webview";
import * as Browser from "expo-web-browser";
import { storySelection, creditUrl } from "./src/reader-presentation.mjs";
import bundledFeed from "./src/generated/feed.json";
import { createContentStore } from "./src/content-store.mjs";
import { themes, resolveAppearance, themedStyles } from "./src/theme.mjs";
const ThemeContext = createContext(null);
const useStyles = () =>
  themedStyles(baseStyles, useContext(ThemeContext).palette);
const origin = "https://www.ordinarybrief.com";
const uri = (v) => (v?.startsWith("/") ? origin + v : v);
const serif = Platform.OS === "android" ? "serif" : "Georgia";
const openSource = async (url) => {
  try {
    const parsed = new URL(url);
    if (
      ["https:", "http:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    )
      await Browser.openBrowserAsync(url);
  } catch {}
};
function Icon({ name, color, size = 23 }) {
  const { palette } = useContext(ThemeContext);
  color = color || palette.muted;
  const paths = {
    Home: "M4 8l8-5 8 5v13H4z M8 11h8 M8 15h8 M8 18h5",
    Scores: "M3 5h18v14H3z M7 9h3v5H7z M14 9h3v5h-3z",
    Teams: "M5 21v-3a4 4 0 018 0v3 M15 14a4 4 0 014 4v3",
    Culture: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
    Back: "M15 5l-7 7 7 7",
    Play: "M8 4l12 8-12 8z",
    Close: "M6 6l12 12 M18 6L6 18",
    Refresh: "M20 7V3l-3 3a8 8 0 10 3 9 M20 7h-5",
    Crates: "M4 4h16v16H4z M4 9h16 M8 13h8",
    Watch: "M3 6h18v14H3z M8 3l4 3 4-3",
    Staff: "M4 21v-4a8 8 0 0116 0v4 M8 7a4 4 0 108 0 4 4 0 10-8 0",
    Corrections: "M4 20l5-1L21 7l-4-4L5 15z",
    Next: "M9 5l7 7-7 7",
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "More" ? (
        <>
          <Circle cx="5" cy="12" r="1.4" />
          <Circle cx="12" cy="12" r="1.4" />
          <Circle cx="19" cy="12" r="1.4" />
        </>
      ) : (
        <Path d={paths[name] || paths.Home} />
      )}
      {name === "Teams" && (
        <>
          <Circle cx="9" cy="7" r="3" />
          <Circle cx="18" cy="8" r="2" />
        </>
      )}
    </Svg>
  );
}
function Action({ label, onPress, children, style }) {
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[{ minHeight: 44, justifyContent: "center" }, style]}
    >
      {children || <Text style={s.link}>{label}</Text>}
    </Pressable>
  );
}
function Picture({ source, alt = "", ratio, cover = false, style }) {
  const s = useStyles();
  const [size, setSize] = useState(ratio || 1.5),
    [error, setError] = useState(false);
  useEffect(() => {
    setError(false);
    if (!ratio && source)
      Image.getSize(
        uri(source),
        (w, h) => setSize(w / h),
        () => {},
      );
    else setSize(ratio || 1.5);
  }, [source, ratio]);
  return source && !error ? (
    <Image
      accessibilityLabel={alt}
      source={{ uri: uri(source) }}
      style={[
        { width: "100%", aspectRatio: size, backgroundColor: "#e4ded2" },
        style,
      ]}
      resizeMode={cover ? "cover" : "contain"}
      onError={() => setError(true)}
    />
  ) : source ? (
    <Text style={s.note}>Image unavailable · {alt}</Text>
  ) : null;
}
function Credit({ credit }) {
  const s = useStyles();
  return credit?.label ? (
    <Action
      label={`Image credit: ${credit.label}`}
      onPress={() => openSource(credit.url)}
    >
      <Text style={[s.note, { textDecorationLine: "underline" }]}>
        {credit.label} ↗
      </Text>
    </Action>
  ) : null;
}
function Inline({ nodes }) {
  return nodes.map((n, i) =>
    n.text !== undefined ? (
      <Text key={i}>{n.text}</Text>
    ) : (
      <Text
        key={i}
        accessibilityRole={n.kind === "a" ? "link" : undefined}
        onPress={n.url ? () => openSource(n.url) : undefined}
        style={{
          fontStyle: ["em", "i"].includes(n.kind) ? "italic" : undefined,
          fontWeight: ["strong", "b"].includes(n.kind) ? "700" : undefined,
          fontSize: n.kind === "small" ? 12 : undefined,
          textDecorationLine: n.kind === "a" ? "underline" : undefined,
        }}
      >
        <Inline nodes={n.children} />
      </Text>
    ),
  );
}
function Paragraph({ text }) {
  const s = useStyles();
  return (
    <Text style={s.body}>
      {text.split(/(\*[^*\n]+\*)/g).map((p, i) => (
        <Text
          key={i}
          style={p.startsWith("*") ? { fontStyle: "italic" } : null}
        >
          {p.startsWith("*") ? p.slice(1, -1) : p}
        </Text>
      ))}
    </Text>
  );
}
function NativeVideo({ video }) {
  const s = useStyles();
  const [status, setStatus] = useState("loading"),
    [ratio, setRatio] = useState(9 / 16);
  const player = useVideoPlayer({ uri: uri(video.src) }, (p) => {
    p.play();
  });
  useEffect(() => {
    setStatus(player.status);
    const a = player.addListener("statusChange", (e) => setStatus(e.status));
    const b = player.addListener("sourceLoad", (e) => {
      const z = e.availableVideoTracks?.[0]?.size;
      if (z?.width && z?.height) setRatio(z.width / z.height);
    });
    return () => {
      a.remove();
      b.remove();
      player.pause();
    };
  }, [player]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (v) => {
      if (v !== "active") player.pause();
    });
    return () => sub.remove();
  }, [player]);
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <VideoView
        player={player}
        style={{ width: "100%", aspectRatio: ratio, maxHeight: "90%" }}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
      />
      {status === "loading" && (
        <View style={s.loading}>
          <ActivityIndicator color="white" />
          <Text style={s.white}>Loading video…</Text>
        </View>
      )}
      {status === "error" && (
        <View style={s.loading}>
          <Text style={s.white}>
            Video could not load. Check your connection.
          </Text>
          <Action
            label="Retry video"
            onPress={() =>
              player
                .replaceAsync({ uri: uri(video.src) })
                .then(() => player.play())
                .catch(() => setStatus("error"))
            }
          />
        </View>
      )}
    </View>
  );
}
function MediaModal({ media, close, reduce }) {
  const s = useStyles();
  let embed = null;
  if (media.type === "external")
    embed =
      "https://www.youtube-nocookie.com/embed/" +
      new URL(media.url).searchParams.get("v") +
      "?playsinline=1";
  if (media.type === "xclip")
    embed = "https://platform.twitter.com/embed/Tweet.html?id=" + media.tweetId;
  if (media.type === "instagram") embed = media.url;
  const [failed, setFailed] = useState(false);
  return (
    <Modal
      visible
      animationType={reduce ? "none" : "slide"}
      onRequestClose={close}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#11100e" }}>
        <View style={s.mediaBar}>
          <Text style={[s.white, { flex: 1 }]}>
            {media.title || "Original clip"}
          </Text>
          <Action label="Close media" onPress={close}>
            <Icon name="Close" color="white" />
          </Action>
        </View>
        {media.src ? (
          <NativeVideo video={media} />
        ) : embed ? (
          <>
            <WebView
              source={{ uri: embed }}
              style={{ flex: 1, backgroundColor: "#111" }}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              allowFileAccess={false}
              mixedContentMode="never"
              javaScriptCanOpenWindowsAutomatically={false}
              startInLoadingState
              renderLoading={() => <ActivityIndicator />}
              onError={() => setFailed(true)}
              onHttpError={() => setFailed(true)}
              originWhitelist={["https://*"]}
              onShouldStartLoadWithRequest={(r) => {
                if (!r.isTopFrame || r.url === embed || r.url === "about:blank")
                  return true;
                try {
                  const h = new URL(r.url).hostname;
                  if (
                    [
                      "www.youtube-nocookie.com",
                      "platform.twitter.com",
                      "www.instagram.com",
                    ].includes(h)
                  )
                    return true;
                } catch {}
                openSource(r.url);
                return false;
              }}
            />
            <View style={{ padding: 16 }}>
              <Text style={s.white}>
                {failed
                  ? "This provider could not load the embed."
                  : "Media is provided online by its original publisher."}
              </Text>
              <Action
                label="Open original in app"
                onPress={() => openSource(media.url)}
              />
            </View>
          </>
        ) : (
          <Text style={s.white}>This media format is not supported.</Text>
        )}
      </SafeAreaView>
    </Modal>
  );
}
function MediaCard({ video, play, compact = false }) {
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
      onPress={() => play({ ...video, type: "video" })}
      style={[s.videoCard, compact && { width: 180 }]}
    >
      <Picture
        source={video.poster || video.fallbackPoster}
        alt={video.title}
        ratio={9 / 16}
        cover
      />
      <View style={s.playOverlay}>
        <Icon name="Play" color="white" size={28} />
      </View>
      <View style={s.videoCaption}>
        <Text style={s.videoBy}>{video.correspondent}</Text>
        <Text style={s.videoTitle}>{video.title}</Text>
      </View>
    </Pressable>
  );
}
function Reader({ article: a, close, play }) {
  const s = useStyles();
  const ref = useRef(null),
    offset = useRef(0),
    restored = useRef(false);
  const [saved, setSaved] = useState(null),
    [contentHeight, setContentHeight] = useState(0);
  const key = `brief:global:v1:${a.slug}:position`;
  const save = () => {
    if (restored.current)
      AsyncStorage.setItem(key, String(offset.current)).catch(() => {});
  };
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((v) => setSaved(Math.max(0, Number(v) || 0)))
      .catch(() => setSaved(0));
    const sub = AppState.addEventListener("change", (v) => {
      if (v !== "active") save();
    });
    return () => sub.remove();
  }, [key]);
  useEffect(() => {
    if (saved !== null && contentHeight > 0 && !restored.current) {
      ref.current?.scrollTo({ y: saved, animated: false });
      restored.current = true;
    }
  }, [saved, contentHeight]);
  const hero = (
    <>
      <Picture source={a.image} alt={a.imageAlt} />
      <Credit credit={a.imageCredit} />
    </>
  );
  return (
    <>
      <View style={s.readerBar}>
        <Action
          label="Back"
          onPress={() => {
            save();
            close();
          }}
        >
          <Icon name="Back" color="#f3efe5" />
        </Action>
        <Text style={s.wordmark}>The Brief</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        ref={ref}
        contentContainerStyle={s.readerContent}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        onScroll={(e) => (offset.current = e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={100}
        onScrollEndDrag={save}
        onMomentumScrollEnd={save}
      >
        {a.heroMode === "first" && hero}
        <Text style={s.eyebrow}>{a.section}</Text>
        <Text style={s.headline}>{a.title}</Text>
        <Text style={s.dek}>{a.dek}</Text>
        <Text style={s.byline}>
          {a.by} · {a.date}
        </Text>
        {a.media && (
          <Action
            label={a.media.title || "Play original clip"}
            onPress={() => play(a.media)}
            style={s.embedCard}
          >
            <Picture
              source={a.media.poster}
              alt={a.media.title}
              ratio={16 / 9}
            />
            <View style={s.embedLabel}>
              <Icon name="Play" />
              <Text style={s.byline}>Watch original clip</Text>
            </View>
            {a.media.title ? <Text style={s.note}>{a.media.title}</Text> : null}
          </Action>
        )}
        {a.heroMode === "normal" && hero}
        {a.source && (
          <Action
            label={`Source: ${a.source.label}`}
            onPress={() => openSource(a.source.url)}
          />
        )}
        <View style={s.articleRule} />
        {a.blocks.map((b) => (
          <View key={b.id}>
            {b.type === "paragraph" ? (
              <Paragraph text={b.text} />
            ) : b.type === "rich" ? (
              <Text style={s.body}>
                <Inline nodes={b.nodes} />
              </Text>
            ) : b.type === "heading" ? (
              <Text style={s.sectionHeading}>{b.text}</Text>
            ) : b.type === "statistic" ? (
              <Text style={s.stat}>{b.text}</Text>
            ) : b.type === "break" ? (
              <View style={{ height: 28 }} />
            ) : b.type === "image" ? (
              <View style={{ marginVertical: 18 }}>
                <Picture source={b.src} alt={b.alt} />
                {b.caption ? <Text style={s.note}>{b.caption}</Text> : null}
                <Credit credit={b.credit} />
              </View>
            ) : (
              <Action
                label={`Watch ${b.title || "original clip"}`}
                onPress={() => play(b)}
                style={s.embedCard}
              >
                <View style={s.embedLabel}>
                  <Icon name="Play" />
                  <Text style={s.byline}>
                    {b.title || "Original clip on X"}
                  </Text>
                </View>
                <Text style={s.note}>Opens here · online media</Text>
              </Action>
            )}
          </View>
        ))}
        {a.receipt && (
          <View style={s.receipt}>
            <Text style={s.eyebrow}>THE RECEIPTS</Text>
            <Text style={s.title}>{a.receipt}</Text>
          </View>
        )}
        <Action
          label="← Return to the front page"
          onPress={() => {
            save();
            close();
          }}
        />
      </ScrollView>
    </>
  );
}
function StoryCard({ a, open, lead = false, compact = false }) {
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read ${a.title}`}
      onPress={() => open(a.slug)}
      style={[s.story, compact && { width: 285, marginRight: 18 }]}
    >
      <Picture
        source={a.image}
        alt={a.imageAlt}
        ratio={lead ? 1.42 : 16 / 9}
        cover={!a.slug.includes("saturation-bombing")}
      />
      <Text style={[s.eyebrow, { marginTop: 20 }]}>{a.section}</Text>
      <Text style={lead ? s.headline : s.title}>{a.title}</Text>
      <Text style={s.dek}>{a.dek}</Text>
      <Text style={s.byline}>{a.by}</Text>
      <Text style={s.read}>READ {a.by?.split(" ")[0]?.toUpperCase()} →</Text>
    </Pressable>
  );
}
function Fade({ children, reduce, style }) {
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: reduce ? 0 : 180,
      useNativeDriver: true,
    }).start();
  }, [reduce]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
function EmptyLeague({ screen, select }) {
  const s = useStyles();
  const scores = screen === "Scores";
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={screen} size={34} />
      </View>
      <Text style={s.eyebrow}>YOUR LEAGUE, WHEN YOU’RE READY</Text>
      <Text style={s.headline}>
        {scores ? "Every Sunday has a story." : "A place for your people."}
      </Text>
      <Text style={s.dek}>
        {scores
          ? "Your matchups, live scores and weekly results will belong here. For now, there’s a whole sporting world to follow."
          : "Your league’s teams and rivalries will have a home here. Until then, meet the voices covering the game beyond your roster."}
      </Text>
      <Text style={s.note}>
        League setup is not available in this preview. You can explore The Brief
        without connecting a league.
      </Text>
      <Action
        label={scores ? "Read the latest →" : "Explore Culture →"}
        onPress={() => select(scores ? "Home" : "Culture")}
        style={s.primary}
      />
      <Action label="Browse The Crates" onPress={() => select("Crates")} />
    </View>
  );
}
function Shell() {
  const s = useStyles();
  const { palette, appearance, preference, setPreference } =
    useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const store = useRef(null);
  if (!store.current)
    store.current = createContentStore({
      bundled: bundledFeed,
      endpoint: process.env.EXPO_PUBLIC_BRIEF_CONTENT_URL,
      storage: AsyncStorage,
    });
  const [feed, setFeed] = useState(store.current.get()),
    [tab, setTab] = useState("Home"),
    [screen, setScreen] = useState("Home"),
    [slug, setSlug] = useState(null),
    [query, setQuery] = useState(""),
    [topic, setTopic] = useState("Everything"),
    [media, setMedia] = useState(null),
    [notice, setNotice] = useState(""),
    [refreshing, setRefreshing] = useState(false),
    [culturePage, setCulturePage] = useState(0);
  const [reduce, setReduce] = useState(true),
    [navWidth, setNavWidth] = useState(0);
  const glider = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    Animated.timing(glider, {
      toValue:
        (["Home", "Scores", "Teams", "Culture", "More"].indexOf(tab) *
          (navWidth - 16)) /
        5,
      duration: reduce ? 0 : 180,
      useNativeDriver: true,
    }).start();
  }, [tab, navWidth, reduce]);
  useEffect(() => {
    store.current.restore().then(setFeed);
  }, []);
  const refresh = async () => {
    setRefreshing(true);
    const r = await store.current.refresh();
    setFeed(r.feed);
    setNotice(
      {
        updated: "Content refreshed.",
        retained: "Could not refresh. Your saved content is still available.",
        unconfigured: "Live publishing is not configured in this prototype.",
        busy: "Content is already loading.",
      }[r.status],
    );
    setRefreshing(false);
  };
  const open = (slug) => setSlug(slug);
  const a = slug
    ? slug === feed.reader.slug
      ? feed.reader
      : feed.readers.find((x) => x.slug === slug)
    : null;
  const select = (t) => {
    setMedia(null);
    setSlug(null);
    setTab(t === "Crates" ? "More" : t);
    setScreen(t);
  };
  const cards = storySelection(feed, { tab: "The Crates", query, topic }).cards;
  return (
    <View
      style={[s.shell, { paddingTop: insets.top, backgroundColor: "#11100e" }]}
    >
      <View
        style={{
          flex: 1,
          backgroundColor:
            screen === "Culture" && !a ? "#171613" : palette.canvas,
        }}
      >
        {a ? (
          <Reader
            key={a.slug}
            article={a}
            close={() => setSlug(null)}
            play={setMedia}
          />
        ) : (
          <>
            <View style={s.header}>
              <Text style={s.wordmark}>The</Text>
              <Image
                source={require("./assets/brand.png")}
                style={{ width: 34, height: 34, marginHorizontal: 9 }}
              />
              <Text style={s.wordmark}>Brief</Text>
              <Action
                label="Refresh stories"
                onPress={refresh}
                style={{
                  position: "absolute",
                  right: 16,
                  width: 44,
                  alignItems: "center",
                }}
              >
                <Icon name="Refresh" color="#f3efe5" size={18} />
              </Action>
            </View>
            <ScrollView
              key={screen + (screen === "Culture" ? culturePage : "")}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refresh} />
              }
              contentContainerStyle={[
                s.content,
                { paddingBottom: 110 + insets.bottom },
              ]}
            >
              <Fade key={screen} reduce={reduce}>
                {screen === "Home" ? (
                  <>
                    {feed.home.map((p, i) => (
                      <View key={i}>
                        {p.kind === "lead" && (
                          <View style={s.flag}>
                            <Text style={s.eyebrow}>
                              THE BRIEF • LEAD STORY
                            </Text>
                          </View>
                        )}
                        {p.kind === "carousel" ? (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            decelerationRate="fast"
                            snapToInterval={303}
                            contentContainerStyle={{ paddingBottom: 8 }}
                          >
                            {p.cards.map((c) => (
                              <StoryCard
                                key={c.slug}
                                a={{
                                  ...feed.cards.find((a) => a.slug === c.slug),
                                  ...c,
                                }}
                                open={open}
                                compact
                              />
                            ))}
                          </ScrollView>
                        ) : (
                          p.cards.map((c) => (
                            <View key={c.slug}>
                              <StoryCard
                                a={{
                                  ...feed.cards.find((a) => a.slug === c.slug),
                                  ...c,
                                }}
                                open={open}
                                lead={p.kind === "lead"}
                              />
                              {p.kind === "assignment" &&
                                feed.watch
                                  .filter((v) => v.slug === c.slug)
                                  .map((v) => (
                                    <MediaCard
                                      key={v.id}
                                      video={v}
                                      play={setMedia}
                                    />
                                  ))}
                            </View>
                          ))
                        )}
                      </View>
                    ))}
                    <Action
                      label="Dig into The Crates →"
                      onPress={() => setScreen("Crates")}
                    />
                    <Text style={s.sectionHeading}>also…</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {feed.watch
                        .filter((v) => v.kind === "Dispatch")
                        .map((v) => (
                          <MediaCard
                            compact
                            key={v.id}
                            video={v}
                            play={setMedia}
                          />
                        ))}
                    </ScrollView>
                  </>
                ) : screen === "Culture" ? (
                  <>
                    <Text style={[s.eyebrow, { color: "#c1a77b" }]}>
                      CULTURE DESK
                    </Text>
                    <Text style={[s.headline, s.cream]}>
                      Matters of Culture
                    </Text>
                    <Text style={[s.dek, { color: "#bdb5a8" }]}>
                      Important to someone.
                    </Text>
                    {feed.culture
                      .slice(culturePage * 5, culturePage * 5 + 5)
                      .map((c) => {
                        const a = feed.cards.find((x) => x.slug === c.slug);
                        return (
                          <Pressable
                            key={c.slug}
                            accessibilityRole="button"
                            accessibilityLabel={`Read ${c.title}`}
                            onPress={() => open(c.slug)}
                            style={[
                              s.story,
                              { borderColor: "#5a554c", marginTop: 24 },
                            ]}
                          >
                            <Picture
                              source={c.image || a.image}
                              alt={c.title}
                              ratio={16 / 9}
                              cover
                            />
                            <Text
                              style={[
                                s.eyebrow,
                                { color: "#c1a77b", marginTop: 20 },
                              ]}
                            >
                              {c.tag}
                            </Text>
                            <Text style={[s.title, s.cream]}>{c.title}</Text>
                            <Text style={[s.byline, { color: "#bdb5a8" }]}>
                              {a.by}
                            </Text>
                            <Text style={[s.dek, { color: "#bdb5a8" }]}>
                              {c.dek}
                            </Text>
                            <Text style={[s.read, { color: "#c1a77b" }]}>
                              {c.read}
                            </Text>
                          </Pressable>
                        );
                      })}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Action
                        label="Newer culture stories"
                        onPress={() =>
                          setCulturePage(Math.max(0, culturePage - 1))
                        }
                      >
                        <Text
                          style={{ color: culturePage ? "#f3efe5" : "#777" }}
                        >
                          ← NEWER
                        </Text>
                      </Action>
                      <Text style={{ color: "#bdb5a8", fontSize: 10 }}>
                        PAGE {culturePage + 1} OF{" "}
                        {Math.ceil(feed.culture.length / 5)}
                      </Text>
                      <Action
                        label="Older culture stories"
                        onPress={() =>
                          setCulturePage(
                            Math.min(
                              Math.ceil(feed.culture.length / 5) - 1,
                              culturePage + 1,
                            ),
                          )
                        }
                      >
                        <Text
                          style={{
                            color:
                              culturePage <
                              Math.ceil(feed.culture.length / 5) - 1
                                ? "#f3efe5"
                                : "#777",
                          }}
                        >
                          OLDER →
                        </Text>
                      </Action>
                    </View>
                  </>
                ) : screen === "Crates" ? (
                  <>
                    <Text style={s.headline}>
                      {screen === "Culture"
                        ? "Matters of Culture"
                        : "The Crates"}
                    </Text>
                    <TextInput
                      accessibilityLabel="Search The Crates"
                      placeholderTextColor={palette.muted}
                      selectionColor={palette.accent}
                      placeholder="Search stories or correspondents"
                      value={query}
                      onChangeText={setQuery}
                      style={s.search}
                    />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {[
                        "Everything",
                        ...new Set(
                          feed.cards.map((a) => a.topic).filter(Boolean),
                        ),
                      ].map((t) => (
                        <Action
                          key={t}
                          label={t}
                          onPress={() => setTopic(t)}
                          style={[
                            s.chip,
                            topic === t && { backgroundColor: palette.surface },
                          ]}
                        />
                      ))}
                    </ScrollView>
                    {cards
                      .filter(
                        (a) =>
                          screen !== "Culture" ||
                          a.section.startsWith("MATTERS OF CULTURE"),
                      )
                      .map((a) => (
                        <StoryCard key={a.slug} a={a} open={open} />
                      ))}
                    {cards.length === 0 && (
                      <Text style={s.dek}>
                        No stories match. Try another search or topic.
                      </Text>
                    )}
                  </>
                ) : screen === "Watch" ? (
                  <>
                    <Text style={s.headline}>Watch</Text>
                    {feed.watch.map((v) => (
                      <View key={v.id} style={{ marginBottom: 26 }}>
                        <MediaCard video={v} play={setMedia} />
                      </View>
                    ))}
                  </>
                ) : screen === "More" ? (
                  <>
                    <Text style={s.eyebrow}>EXPLORE THE BRIEF</Text>
                    <Text style={s.headline}>A little further.</Text>
                    <Text style={s.dek}>
                      Good stories reward a second look.
                    </Text>
                    {[
                      {
                        name: "Crates",
                        title: "The Crates",
                        detail: "The archive. Every desk, every voice.",
                      },
                      {
                        name: "Watch",
                        title: "Watch",
                        detail: "Dispatches from the field.",
                      },
                      {
                        name: "Staff",
                        title: "Our correspondents",
                        detail: "Meet the people behind the bylines.",
                      },
                      {
                        name: "Corrections",
                        title: "Corrections",
                        detail: "Keeping the record straight.",
                      },
                    ].map((t) => (
                      <Action
                        key={t.name}
                        label={t.title}
                        onPress={() => setScreen(t.name)}
                        style={s.moreRow}
                      >
                        <View style={s.menuIcon}>
                          <Icon name={t.name} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.menuTitle}>{t.title}</Text>
                          <Text style={s.note}>{t.detail}</Text>
                        </View>
                        <Icon name="Next" size={16} />
                      </Action>
                    ))}
                    <View style={{ marginTop: 32 }}>
                      <Text style={s.eyebrow}>APPEARANCE</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {["System", "Light", "Dark"].map((value) => (
                          <Pressable
                            key={value}
                            accessibilityRole="radio"
                            accessibilityLabel={value + " appearance"}
                            accessibilityState={{
                              checked: preference === value,
                            }}
                            onPress={() => setPreference(value)}
                            style={{
                              flex: 1,
                              minHeight: 48,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor:
                                preference === value
                                  ? palette.accent
                                  : palette.border,
                              backgroundColor:
                                preference === value
                                  ? palette.surface
                                  : "transparent",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  preference === value
                                    ? palette.accent
                                    : palette.text,
                                fontWeight: "600",
                              }}
                            >
                              {value}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={[s.note, { marginTop: 12 }]}>
                        System follows your device’s appearance.
                      </Text>
                    </View>
                  </>
                ) : ["Scores", "Teams"].includes(screen) ? (
                  <EmptyLeague screen={screen} select={select} />
                ) : (
                  <>
                    <Text style={s.headline}>
                      {screen === "Staff"
                        ? "Our correspondents"
                        : "Corrections"}
                    </Text>
                    <Text style={s.dek}>
                      {screen === "Staff"
                        ? "The people behind The Brief."
                        : "A publication should be willing to show its work—and correct it."}
                    </Text>
                    <Text style={s.note}>
                      This section’s native edition is still being prepared. The
                      complete page is available in the in-app browser.
                    </Text>
                    <Action
                      label={
                        screen === "Staff"
                          ? "Meet the correspondents ↗"
                          : "Read corrections ↗"
                      }
                      onPress={() =>
                        openSource(
                          origin +
                            (screen === "Staff" ? "/staff" : "/corrections"),
                        )
                      }
                    />
                    <Action
                      label="Browse stories instead →"
                      onPress={() => setScreen("Crates")}
                    />
                    <Action
                      label="Return to More"
                      onPress={() => select("More")}
                    />
                  </>
                )}
              </Fade>
              {notice ? (
                <Text accessibilityLiveRegion="polite" style={s.note}>
                  {notice}
                </Text>
              ) : null}
            </ScrollView>
            <View
              style={[
                s.navPosition,
                { bottom: Math.max(8, insets.bottom - 8) },
              ]}
            >
              <BlurView
                intensity={75}
                tint={appearance === "dark" ? "dark" : "light"}
                style={s.nav}
                onLayout={(e) => setNavWidth(e.nativeEvent.layout.width)}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    s.glider,
                    {
                      width: (navWidth - 16) / 5,
                      transform: [{ translateX: glider }],
                    },
                  ]}
                />
                {["Home", "Scores", "Teams", "Culture", "More"].map((t) => (
                  <Pressable
                    key={t}
                    accessibilityRole="tab"
                    accessibilityLabel={t}
                    accessibilityState={{ selected: tab === t }}
                    onPress={() => select(t)}
                    style={s.navTouch}
                  >
                    <View style={s.navIcon}>
                      <Icon
                        name={t}
                        color={tab === t ? palette.accent : palette.muted}
                      />
                    </View>
                  </Pressable>
                ))}
              </BlurView>
            </View>
          </>
        )}
        {media && (
          <MediaModal
            key={media.id || media.src || media.url}
            media={media}
            reduce={reduce}
            close={() => setMedia(null)}
          />
        )}
      </View>
    </View>
  );
}
export default function App() {
  const system = useColorScheme();
  const [preference, updatePreference] = useState("System");
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("brief:appearance")
      .then((v) => {
        if (active && ["System", "Light", "Dark"].includes(v))
          updatePreference(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const setPreference = (value) => {
    updatePreference(value);
    AsyncStorage.setItem("brief:appearance", value).catch(() => {});
  };
  const appearance = resolveAppearance(preference, system);
  const palette = themes[appearance];
  return (
    <ThemeContext.Provider
      value={{ preference, setPreference, appearance, palette }}
    >
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <Shell />
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}
const baseStyles = StyleSheet.create({
  shell: { flex: 1 },
  header: {
    height: 49,
    backgroundColor: "#11100e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: "700",
    color: "#f3efe5",
    letterSpacing: -0.7,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    maxWidth: 740,
    width: "100%",
    alignSelf: "center",
  },
  flag: {
    borderTopWidth: 6,
    borderBottomWidth: 1,
    borderColor: "#11100e",
    paddingTop: 12,
    paddingBottom: 6,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: "#92342b",
    marginBottom: 10,
  },
  headline: {
    fontFamily: serif,
    fontWeight: "700",
    fontSize: 40,
    lineHeight: 39,
    letterSpacing: -1.5,
    color: "#11100e",
    marginBottom: 4,
  },
  title: {
    fontFamily: serif,
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: "#11100e",
  },
  dek: {
    fontFamily: serif,
    fontSize: 18,
    lineHeight: 25,
    color: "#6d675d",
    marginVertical: 14,
  },
  byline: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    marginVertical: 10,
    color: "#11100e",
  },
  story: {
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderColor: "#11100e",
  },
  read: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: "#92342b",
    paddingTop: 20,
    paddingBottom: 4,
  },
  link: { fontSize: 12, fontWeight: "700", color: "#92342b" },
  note: { fontSize: 11, lineHeight: 17, color: "#6d675d" },
  readerBar: {
    height: 49,
    paddingHorizontal: 18,
    backgroundColor: "#11100e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readerContent: {
    padding: 22,
    paddingTop: 28,
    paddingBottom: 65,
    maxWidth: 740,
    alignSelf: "center",
    width: "100%",
  },
  articleRule: { height: 1, backgroundColor: "#b8b2a6", marginVertical: 16 },
  body: {
    fontFamily: serif,
    fontSize: 19,
    lineHeight: 30,
    color: "#211e1a",
    marginVertical: 12,
  },
  sectionHeading: {
    fontFamily: serif,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 18,
  },
  stat: {
    fontFamily: serif,
    fontSize: 80,
    fontWeight: "700",
    color: "#a52a22",
    marginVertical: 25,
  },
  receipt: {
    borderTopWidth: 3,
    borderColor: "#11100e",
    marginTop: 30,
    paddingTop: 20,
  },
  embedCard: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#c9c1b4",
    marginVertical: 20,
  },
  embedLabel: { flexDirection: "row", alignItems: "center", gap: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#c9c1b4",
    padding: 14,
    fontSize: 16,
    marginVertical: 18,
  },
  chip: {
    paddingHorizontal: 12,
    borderRadius: 22,
    marginRight: 6,
    marginBottom: 20,
  },
  navPosition: {
    position: "absolute",
    left: 12,
    right: 12,
    alignItems: "center",
  },
  nav: {
    height: 54,
    width: "100%",
    maxWidth: 380,
    borderRadius: 29,
    overflow: "hidden",
    flexDirection: "row",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.82)",
    backgroundColor: "rgba(239,234,224,.5)",
    shadowColor: "#11100e",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  navTouch: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    width: 50,
    height: 46,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  navSelected: {
    backgroundColor: "rgba(255,255,255,.58)",
    borderWidth: 1,
    borderColor: "rgba(165,42,34,.22)",
  },
  cream: { color: "#f3efe5" },
  empty: { paddingTop: 28, paddingBottom: 30 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e8e0d2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  primary: {
    marginTop: 30,
    marginBottom: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: "#a59278",
    borderRadius: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e8e0d2",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontFamily: serif,
    fontWeight: "700",
    fontSize: 20,
    color: "#211e1a",
    marginBottom: 5,
  },
  glider: {
    position: "absolute",
    left: 8,
    top: 3,
    height: 46,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,.58)",
    borderWidth: 1,
    borderColor: "rgba(165,42,34,.22)",
  },
  moreRow: {
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderColor: "#c9c1b4",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  videoCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#111",
    marginRight: 12,
  },
  playOverlay: {
    position: "absolute",
    top: "42%",
    left: "40%",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "rgba(0,0,0,.65)",
  },
  videoBy: {
    color: "#eee",
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  videoTitle: {
    color: "white",
    fontFamily: serif,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 4,
  },
  mediaBar: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  white: { color: "white", fontSize: 14, lineHeight: 21 },
  loading: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "40%",
    padding: 22,
    backgroundColor: "rgba(0,0,0,.85)",
    alignItems: "center",
    gap: 12,
  },
});
