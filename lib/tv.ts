/**
 * Live TV sources. These use YouTube's own embedded player. Whether a given channel
 * allows embedding is the channel owner's choice and can change, and showing a
 * broadcaster's stream on a paid customer site may need their permission. Confirm the
 * channel IDs and the rights before launch. The player falls back to an "open" link.
 */
export const TV_PRESETS = [
  { id: 'bloomberg', label: 'Bloomberg TV', channel: 'UCIALMKvObZNtJ6AmdCLP7Lg', page: 'https://www.bloomberg.com/live' },
];
/** Channels where the customer signs in with their own subscription on the provider's site. We open it in a pop-up and never see their login. */
export const POPUP_SOURCES = [{ id: 'cnbc', label: 'CNBC', url: 'https://www.cnbc.com/live-tv/' }];
export function youtubeEmbed(input: string): string | null {
  try {
    const u = new URL(input.trim()); let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (/(^|\.)youtube\.com$/.test(u.hostname)) id = u.searchParams.get('v') || u.pathname.match(/^\/(?:live|embed)\/([\w-]{11})/)?.[1] || '';
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&mute=1` : null;
  } catch { return null; }
}
export const channelEmbed = (channel: string) => `https://www.youtube-nocookie.com/embed/live_stream?channel=${channel}&autoplay=0&mute=1`;
