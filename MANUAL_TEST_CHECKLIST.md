# Manual Test Checklist

## Mobile

- Search and all five tabs fit at 360px width without horizontal overflow
- Bottom navigation respects safe area and 44px touch targets
- Score/risk states include text, not color alone
- Thai text has no clipped tone marks

## Desktop/tablet

- Content remains readable at 768px and 1280px
- Keyboard reaches search, actions, chart controls, and tabs in logical order
- Focus indicator is visible

## Data/API

- Mock data is visibly labeled
- Repeated ticker within five minutes uses cache
- Failed analysis does not consume a round
- 429 stops retry
- Partial provider failure remains understandable

## PWA/offline

- Manifest and icons load
- Install prompt requirements are met
- Offline shell loads
- Cached result shows original timestamp and offline/stale label

## Security

- Client bundle contains no secret values
- API errors contain no stack or internal path
- `.env.local` remains ignored
- No Git remote, Push, or Vercel deployment occurred
