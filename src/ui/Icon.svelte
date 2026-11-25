<script lang="ts" module>
  // One stroke set: 24 grid, 1.75px stroke, round caps/joins (docs/DESIGN.md).
  const PATHS = {
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
    expand: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
    shrink: 'M9 4v5H4 M15 4v5h5 M9 20v-5H4 M15 20v-5h5',
    more: 'M12 6.5h.01 M12 12h.01 M12 17.5h.01',
    close: 'M6 6l12 12 M18 6 6 18',
    check: 'M5 12.5 10 17.5 19 7',
    back: 'M15 5l-7 7 7 7',
    next: 'M9 5l7 7-7 7',
    eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    down: 'M6 9l6 6 6-6',
    grid: 'M4.5 4.5h5v5h-5z M14.5 4.5h5v5h-5z M4.5 14.5h5v5h-5z M14.5 14.5h5v5h-5z',
    clock: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M12 7.5V12l3 2',
    hint: 'M9.5 18h5 M10.5 21h3 M12 3a6 6 0 0 0-3.5 10.9V15.5h7v-1.6A6 6 0 0 0 12 3Z',
    retry: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9 M4.5 4.5V9H9',
    plus: 'M12 5v14 M5 12h14',
    paste: 'M9 4h6v3H9z M15 5.5h2A1.5 1.5 0 0 1 18.5 7v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V7A1.5 1.5 0 0 1 7 5.5h2',
    file: 'M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5Z M13.5 3.5v5h5',
    guide: 'M4.5 5.5A1.5 1.5 0 0 1 6 4h4.5a2 2 0 0 1 1.5.7 2 2 0 0 1 1.5-.7H18a1.5 1.5 0 0 1 1.5 1.5v12a1 1 0 0 1-1 1h-5a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 10.5 18.5h-5a1 1 0 0 1-1-1Z M12 4.7V20',
    edit: 'M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16Z M13.5 6.5l4 4',
    copy: 'M9 9h10v10H9z M15 9V5H5v10h4',
    trash: 'M4.5 7h15 M9.5 7V4.5h5V7 M6.5 7l.8 12.5h9.4L17.5 7',
  } as const
  export type IconName = keyof typeof PATHS
</script>

<script lang="ts">
  let { name, size = 22 }: { name: IconName; size?: number } = $props()
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={PATHS[name]} />
</svg>
