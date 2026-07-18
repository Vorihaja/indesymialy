<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Layout & Overlay Constraints (Fixed Header)

The application uses a fixed layout header with a dynamic height of `84px` (or `124px` when search is active) and a z-index of `z-[100]`.
To ensure elements are not covered or hidden by the header:
- **Overlays & Modals**: Absolute or fixed position elements like modals, alerts, and toasts must be set to a z-index higher than the header (typically `z-[200]`) to overlay it properly.
- **Offsets**: Take into account the header height (`pt-[84px]` or `pt-[124px]`) for viewport-relative layouts and scroll positions.
