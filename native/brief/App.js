import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  StyleSheet,
  Platform,
  Linking,
  BackHandler,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  storySelection,
  creditUrl,
  openImageCredit,
} from "./src/reader-presentation.mjs";
import bundledFeed from "./src/generated/feed.json";
import { createContentStore } from "./src/content-store.mjs";
const origin = "https://www.ordinarybrief.com";
const uri = (value) => (value?.startsWith("/") ? origin + value : value);
const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  web: "Georgia",
});
function Button({ children, onPress, selected = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.button, selected && s.active]}
    >
      <Text style={[s.label, selected && { color: "#fff" }]}>{children}</Text>
    </Pressable>
  );
}
function Picture({ source, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  return source && !failed ? (
    <Image
      accessibilityLabel={alt}
      source={{ uri: uri(source) }}
      style={s.picture}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  ) : (
    <Text style={s.note}>Image unavailable · {alt}</Text>
  );
}
function RichText({ text }) {
  return (
    <Text style={s.body}>
      {text.split(/(\*[^*]+\*)/g).map((part, i) => (
        <Text
          key={i}
          style={part.startsWith("*") ? { fontStyle: "italic" } : null}
        >
          {part.startsWith("*") ? part.slice(1, -1) : part}
        </Text>
      ))}
    </Text>
  );
}
function Player({ video }) {
  const [error, setError] = useState("");
  const player = useVideoPlayer(video.src);
  useEffect(() => {
    const sub = player.addListener("statusChange", (e) =>
      setError(
        e.status === "error"
          ? "Video unavailable. Please try again online."
          : "",
      ),
    );
    return () => sub.remove();
  }, [player]);
  return (
    <View>
      <VideoView
        player={player}
        style={s.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
      {error ? (
        <Text accessibilityRole="alert" style={s.note}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
function Reader({ close, article }) {
  const a = article,
    scroll = useRef(null),
    offset = useRef(0),
    ready = useRef(false),
    restored = useRef(false),
    [saved, setSaved] = useState(null),
    [height, setHeight] = useState(0),
    [notice, setNotice] = useState("");
  const key = `brief:global:v1:${a.slug}:position`;
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(key)
      .then((v) => {
        if (live) {
          const n = Number(v);
          setSaved(Number.isFinite(n) ? Math.max(0, n) : 0);
        }
      })
      .catch(() => {
        if (live) {
          setSaved(0);
          setNotice("Reading position is unavailable on this device.");
        }
      });
    return () => {
      live = false;
    };
  }, [key]);
  useEffect(() => {
    if (saved !== null && height > 0 && !restored.current) {
      scroll.current?.scrollTo({ y: saved, animated: false });
      restored.current = true;
      ready.current = true;
    }
  }, [saved, height]);
  const persist = () => {
    if (ready.current)
      AsyncStorage.setItem(key, String(offset.current)).catch(() =>
        setNotice("Could not save reading position."),
      );
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      persist();
      close();
      return true;
    });
    return () => sub.remove();
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <View style={s.readerBar}>
        <Button
          onPress={() => {
            persist();
            close();
          }}
        >
          ← Back
        </Button>
        <Text style={s.note}>THE BRIEF / READER</Text>
      </View>
      <ScrollView
        ref={scroll}
        onContentSizeChange={(_, h) => setHeight(h)}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={150}
        onMomentumScrollEnd={persist}
        onScrollEndDrag={persist}
        contentContainerStyle={s.content}
      >
        <Text style={s.eyebrow}>{a.section}</Text>
        <Text style={s.headline}>{a.title}</Text>
        <Text style={s.dek}>{a.dek}</Text>
        <Text style={s.byline}>
          {a.by} · {a.date}
        </Text>
        <Picture source={a.image} alt={a.imageAlt} />
        {creditUrl(a.imageCredit) ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Image credit: ${a.imageCredit.label}`}
            style={{ minHeight: 44, justifyContent: "center" }}
            onPress={async () => {
              if (!(await openImageCredit(a.imageCredit, Linking.openURL)))
                setNotice("Could not open the image credit.");
            }}
          >
            <Text style={[s.note, { textDecorationLine: "underline" }]}>
              {a.imageCredit.label} ↗
            </Text>
          </Pressable>
        ) : (
          <Text style={s.note}>{a.imageCredit?.label}</Text>
        )}
        {a.blocks.map((b) => (
          <View key={b.id}>
            {b.type === "paragraph" ? (
              <RichText text={b.text} />
            ) : b.type === "statistic" ? (
              <Text style={s.stat}>{b.text}</Text>
            ) : (
              <View style={s.source}>
                <Text style={s.byline}>{b.title}</Text>
                <Text style={s.note}>YouTube · opens online</Text>
                <Button
                  onPress={() =>
                    Linking.openURL(b.url).catch(() =>
                      setNotice("Could not open the source."),
                    )
                  }
                >
                  Watch original ↗
                </Button>
              </View>
            )}
          </View>
        ))}
        <Text style={s.eyebrow}>END OF ARTICLE</Text>
        <Text style={s.note}>
          {notice ||
            "Article text travels with this prototype. Images and video need a connection."}
        </Text>
      </ScrollView>
    </View>
  );
}
export default function App() {
  const storeRef = useRef(null);
  if (!storeRef.current)
    storeRef.current = createContentStore({
      bundled: bundledFeed,
      endpoint: process.env.EXPO_PUBLIC_BRIEF_CONTENT_URL,
      storage: AsyncStorage,
    });
  const [feed, setFeed] = useState(() => storeRef.current.get());
  useEffect(() => {
    let mounted = true;
    storeRef.current.restore().then((next) => {
      if (mounted) setFeed(next);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const refresh = async () => {
    setNotice("Checking for corrections…");
    const result = await storeRef.current.refresh();
    setFeed(result.feed);
    setNotice(
      {
        updated: "Content refreshed.",
        retained: "Could not refresh. Your saved content is still available.",
        unconfigured: "This prototype has no live content source configured.",
        busy: "Content is already loading.",
      }[result.status],
    );
  };
  const [tab, setTab] = useState("Front page"),
    [reader, setReader] = useState(false),
    [query, setQuery] = useState(""),
    [topic, setTopic] = useState("Everything"),
    [playing, setPlaying] = useState(null),
    [notice, setNotice] = useState("");
  const selection = storySelection(feed, { tab, query, topic });
  const open = (a) =>
    a.nativeReader
      ? setReader(true)
      : Linking.openURL(origin + a.href).catch(() =>
          setNotice("Could not open the story."),
        );
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.shell}>
        {reader ? (
          <Reader article={feed.reader} close={() => setReader(false)} />
        ) : (
          <>
            <View style={s.masthead}>
              <Text style={s.brand}>The Brief</Text>
              <Text style={s.tagline}>THE WORLD. AS WE FIND IT.</Text>
            </View>
            <ScrollView contentContainerStyle={s.content}>
              <View style={s.rule}>
                <Text style={s.eyebrow}>
                  {tab === "Front page" ? "THE FRONT PAGE" : tab.toUpperCase()}
                </Text>
                <Button onPress={refresh}>Refresh stories</Button>
              </View>
              {tab === "Watch" ? (
                <>
                  <Text style={s.headline}>From the newsroom.</Text>
                  <Text style={s.dek}>
                    Dispatches, observations and other evidence.
                  </Text>
                  {feed.watch.map((v) => (
                    <View style={s.card} key={v.id}>
                      <Text style={s.eyebrow}>
                        {v.kind} · {v.correspondent}
                      </Text>
                      <Text style={s.title}>{v.title}</Text>
                      {playing === v.id ? (
                        <Player video={v} />
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Play ${v.title}`}
                          onPress={() => setPlaying(v.id)}
                        >
                          <Picture source={v.poster} alt={v.title} />
                          <Text style={s.play}>▶ PLAY DISPATCH</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <>
                  {tab === "The Crates" ? (
                    <>
                      <Text style={s.headline}>Worth another look.</Text>
                      <TextInput
                        accessibilityLabel="Search The Crates"
                        placeholder="Search stories or correspondents"
                        value={query}
                        onChangeText={setQuery}
                        style={s.search}
                      />
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 20 }}
                      >
                        {[
                          "Everything",
                          ...new Set(
                            feed.cards.map((a) => a.topic).filter(Boolean),
                          ),
                        ].map((t) => (
                          <Button
                            selected={topic === t}
                            key={t}
                            onPress={() => setTopic(t)}
                          >
                            {t}
                          </Button>
                        ))}
                      </ScrollView>
                    </>
                  ) : null}
                  {selection.cards.map((a, i) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${a.title}. ${a.nativeReader ? "Read in app" : "Read on website"}`}
                      onPress={() => open(a)}
                      style={s.card}
                      key={a.slug}
                    >
                      <Text style={s.eyebrow}>{a.topic || a.section}</Text>
                      <Text
                        style={
                          i === 0 && tab === "Front page" ? s.headline : s.title
                        }
                      >
                        {a.title}
                      </Text>
                      <Picture source={a.image} alt={a.imageAlt} />
                      <Text style={s.dek}>{a.dek}</Text>
                      <Text style={s.byline}>
                        {a.by} · {a.date}
                      </Text>
                      <Text style={s.link}>
                        {a.nativeReader
                          ? "Read the story →"
                          : "Read on the website ↗"}
                      </Text>
                    </Pressable>
                  ))}
                  {selection.empty ? (
                    <Text style={s.dek}>
                      No stories match. Try another search or topic.
                    </Text>
                  ) : null}
                </>
              )}
              {notice ? <Text style={s.note}>{notice}</Text> : null}
            </ScrollView>
            <View style={s.tabs}>
              {["Front page", "The Crates", "Watch"].map((t) => (
                <Button
                  key={t}
                  selected={tab === t}
                  onPress={() => {
                    setPlaying(null);
                    setTab(t);
                  }}
                >
                  {t}
                </Button>
              ))}
            </View>
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#f5f0e5" },
  masthead: {
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#211e1a",
  },
  brand: {
    fontFamily: serif,
    fontWeight: "700",
    fontSize: 48,
    color: "#a62323",
  },
  tagline: { fontSize: 9, letterSpacing: 3, marginTop: 5 },
  content: {
    padding: 22,
    paddingBottom: 60,
    width: "100%",
    maxWidth: 740,
    alignSelf: "center",
  },
  rule: {
    borderTopWidth: 5,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9b2424",
    marginBottom: 10,
  },
  headline: {
    fontFamily: serif,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    color: "#211e1a",
    marginBottom: 18,
  },
  title: {
    fontFamily: serif,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "700",
    marginBottom: 16,
    color: "#211e1a",
  },
  dek: {
    fontFamily: serif,
    fontSize: 19,
    lineHeight: 27,
    marginVertical: 14,
    color: "#4e4840",
  },
  picture: { width: "100%", aspectRatio: 1.6, backgroundColor: "#e8e1d4" },
  byline: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
    marginVertical: 10,
  },
  card: {
    borderBottomWidth: 1,
    borderColor: "#c9bfae",
    paddingBottom: 25,
    marginBottom: 28,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    borderTopWidth: 1,
    borderColor: "#b8ac9b",
    paddingVertical: 10,
  },
  button: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 4,
    borderRadius: 3,
  },
  active: { backgroundColor: "#a62323" },
  label: { fontSize: 12, fontWeight: "700", color: "#a62323" },
  note: { fontSize: 11, color: "#6b6358", lineHeight: 17 },
  link: { fontSize: 12, color: "#a62323", fontWeight: "700", marginTop: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#b8ac9b",
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  readerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#c9bfae",
  },
  body: {
    fontFamily: serif,
    fontSize: 21,
    lineHeight: 32,
    marginVertical: 13,
    color: "#211e1a",
  },
  stat: {
    fontFamily: serif,
    fontSize: 80,
    fontWeight: "700",
    color: "#a62323",
    marginVertical: 25,
  },
  source: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#b8ac9b",
    paddingVertical: 14,
    marginVertical: 20,
  },
  video: { width: "100%", height: 430, backgroundColor: "#191715" },
  play: {
    backgroundColor: "#a62323",
    color: "#fff",
    padding: 15,
    fontSize: 12,
    fontWeight: "700",
  },
});
