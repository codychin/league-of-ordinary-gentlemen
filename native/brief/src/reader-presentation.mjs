export function storySelection(
  feed,
  { tab, query = "", topic = "Everything" },
) {
  const sorted = [...feed.cards].sort((a, b) => b.timestamp - a.timestamp);
  if (tab === "Front page")
    return {
      cards: feed.home.flatMap(p => p.cards.map(item => ({...feed.cards.find(a => a.slug === item.slug), ...item}))),
      empty: false,
    };
  const cards = sorted.filter(
    (a) =>
      (topic === "Everything" || a.topic === topic) &&
      `${a.title} ${a.by} ${a.dek}`.toLowerCase().includes(query.toLowerCase()),
  );
  return { cards, empty: tab === "The Crates" && cards.length === 0 };
}
export function creditUrl(credit) {
  try {
    const parsed = new URL(credit?.url);
    return parsed.protocol === "https:" &&
      parsed.hostname &&
      !parsed.username &&
      !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
export async function openImageCredit(credit, openURL) {
  const url = creditUrl(credit);
  if (!url) return false;
  try {
    await openURL(url);
    return true;
  } catch {
    return false;
  }
}
