# Marketplace Conversion Analysis

## Challenge

Bonus Challenge 1: Improve Marketplace Conversions

## Problem Analysis

The original marketplace flow worked functionally, but it underperformed as a buying experience.

Primary friction points:

- The grid did not help buyers decide which listing was worth opening first.
- Important decision inputs like pricing, format, placement context, and publisher identity were either missing or visually de-emphasized.
- The marketplace lacked scanning tools, so users had to do too much cognitive work before they could narrow options.
- Detail pages answered only the minimum technical questions and did little to increase confidence or urgency.
- The booking flow existed, but the CTA did not feel like the natural next step in a high-intent buying journey.

## Hypothesis

If the marketplace makes value and relevance obvious earlier in the funnel, more users will click into listings. If the detail page reduces uncertainty and makes the request flow feel higher intent, more detail page visits will convert into placement requests.

More specifically:

- Better card hierarchy should increase grid-to-detail click-through rate.
- Search, filtering, sorting, and view controls should help buyers self-qualify faster and reduce drop-off caused by overload.
- Stronger detail-page context should reduce hesitation before request submission.
- Visible availability and immediate unavailability after booking should create a lightweight scarcity signal.

## Implemented Changes

### Grid improvements

- Added marketplace summary stats to frame the inventory set.
- Added search, type filtering, price sorting, and grid/list view controls.
- Reworked listing cards to surface publisher, price, position, dimensions, CPM floor, and availability status before the click.
- Strengthened card hierarchy and added a clearer "View placement details" affordance.

### Detail-page improvements

- Reworked the header to emphasize listing name, publisher, price, and status.
- Added structured decision cards for availability, position, dimensions, and CPM floor.
- Added contextual guidance explaining why the slot is worth considering and what the sponsor should include in the request.
- Improved request states for sponsor, non-sponsor, loading, success, and failure paths.
- Added a lightweight "what happens next" explanation to make the request flow feel more concrete.

## Measurement Plan

The challenge asks not only for UX changes, but also for a way to verify that they improve conversion. I added lightweight client-side event instrumentation for the key marketplace funnel steps.

Tracked events:

- `marketplace_viewed`
- `marketplace_filters_changed`
- `marketplace_listing_clicked`
- `marketplace_detail_viewed`
- `marketplace_request_attempted`
- `marketplace_request_succeeded`
- `marketplace_request_failed`
- `marketplace_request_blocked`

These events are emitted through a reusable client helper in [analytics.ts](/Users/omerlevi/anvara-takehome-assessment/apps/frontend/lib/analytics.ts).

## Success Metrics

Primary metrics:

- Grid to detail click-through rate
- Detail to request conversion rate
- Overall marketplace visit to request conversion rate

Supporting metrics:

- Filter usage rate
- Search usage rate
- Request failure rate
- Blocked request rate for anonymous or non-sponsor users
- Time from detail view to request attempt

## What Good Results Would Look Like

- More listing clicks per marketplace session
- Higher request completion rate from detail pages
- Lower abandonment after detail-page visits
- Increased usage of filtering/search, indicating better inventory discovery

## Remaining Opportunities

- Move marketplace fetch/filtering to the server for scale and URL-shareable state.
- Add richer trust signals such as audience size, category fit, or example campaign outcomes.
- Add quote-request or save-for-later options for users with interest but lower booking intent.
- Pipe the tracked client events into GA4, Segment, or a backend analytics endpoint for reporting.
