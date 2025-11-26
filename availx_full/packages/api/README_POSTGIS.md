# PostGIS Provider Search API

This document describes the new high-performance PostGIS-based provider search endpoints implemented in the `provider` router.

## Overview

The new `provider` router implements geospatial queries using **PostGIS** for efficient radius-based provider search. This replaces the legacy client-side Haversine distance filtering with database-level spatial queries.

### Performance Improvements

- **Before**: O(n) client-side filtering, fetches 3x limit from database
- **After**: O(log n) with GIST spatial index, database-level filtering
- **Expected**: <50ms query time for 1M providers

## Setup

### 1. Enable PostGIS Extension

Run the migration SQL file to enable PostGIS and create spatial indexes:

```bash
cd packages/database
psql $DATABASE_URL -f prisma/migrations/0001_postgis_setup.sql
```

This migration:
- ✅ Enables PostGIS extension
- ✅ Adds `location_geom` geometry column to `provider_profiles`
- ✅ Creates trigger to sync JSON lat/lng to geometry column
- ✅ Creates GIST spatial index for fast queries
- ✅ Adds full-text search vector and index
- ✅ Creates helper PostgreSQL functions

### 2. Generate Prisma Client

```bash
cd packages/database
npx prisma generate
```

### 3. Verify Setup

```sql
-- Check PostGIS version
SELECT PostGIS_version();

-- Verify spatial index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'provider_profiles'
AND indexname = 'idx_provider_profiles_location_gist';

-- Check geometry data
SELECT
  COUNT(*) as total,
  COUNT("locationGeom") as with_geometry
FROM provider_profiles;
```

## API Endpoints

### 1. Search by Radius (`provider.searchByRadius`)

Find providers within a specified radius of a location.

**Input Schema:**

```typescript
{
  latitude: number;      // -90 to 90
  longitude: number;     // -180 to 180
  radiusKm: number;      // Max 100km, default 10km
  categoryId?: string;   // Filter by category
  minRating?: number;    // Min 0, max 5
  aadhaarVerified?: boolean;
  backgroundVerified?: boolean;
  sortBy?: 'distance' | 'rating' | 'reputation' | 'response_time';
  page?: number;         // Default 1
  limit?: number;        // Max 100, default 20
}
```

**Output:**

```typescript
{
  providers: Array<{
    id: string;
    userId: string;
    user: { name, profilePhoto };
    businessName: string | null;
    description: string | null;
    category: { id, name, slug };
    baseLocation: { lat, lng, address };
    pricing: any;
    averageRating: number;
    reputationScore: number;
    completedJobs: number;
    aadhaarVerified: boolean;
    backgroundVerified: boolean;
    responseTimeSeconds: number;
    distance: number;           // Distance in km
    reviews: Array<Review>;     // Latest 3 reviews
    reviewCount: number;
    bookingCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  searchCenter: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}
```

**Example Usage:**

```typescript
// Next.js / React Query
import { trpc } from '@/utils/trpc';

function ProviderSearch() {
  const { data, isLoading } = trpc.provider.searchByRadius.useQuery({
    latitude: 26.8467,    // Lucknow
    longitude: 80.9462,
    radiusKm: 5,
    categoryId: 'clx123...',
    minRating: 4.0,
    aadhaarVerified: true,
    sortBy: 'distance',
    page: 1,
    limit: 20,
  });

  return (
    <div>
      {data?.providers.map(provider => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          distance={provider.distance}
        />
      ))}
    </div>
  );
}
```

**SQL Query (Simplified):**

```sql
SELECT p.*, ST_Distance(
  p."locationGeom"::geography,
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
) / 1000 AS distance_km
FROM provider_profiles p
WHERE ST_DWithin(
  p."locationGeom"::geography,
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
  radiusKm * 1000  -- Convert to meters
)
AND p."isActive" = true
ORDER BY distance_km ASC;
```

---

### 2. Search by Bounding Box (`provider.searchByBoundingBox`)

Find providers within a map viewport (useful for map views).

**Input Schema:**

```typescript
{
  northEast: { latitude: number; longitude: number };
  southWest: { latitude: number; longitude: number };
  categoryId?: string;
  minRating?: number;
  limit?: number;  // Max 500, default 100
}
```

**Output:**

```typescript
{
  providers: Array<{
    id: string;
    userId: string;
    businessName: string | null;
    categoryId: string;
    baseLocation: { lat, lng, address };
    averageRating: number;
    reputationScore: number;
    completedJobs: number;
    aadhaarVerified: boolean;
  }>;
  bounds: {
    northEast: { latitude, longitude };
    southWest: { latitude, longitude };
  };
}
```

**Example Usage:**

```typescript
// Map component
function ProvidersMap() {
  const map = useMap(); // Google Maps / Leaflet

  const { data } = trpc.provider.searchByBoundingBox.useQuery({
    northEast: {
      latitude: map.getBounds().getNorthEast().lat(),
      longitude: map.getBounds().getNorthEast().lng(),
    },
    southWest: {
      latitude: map.getBounds().getSouthWest().lat(),
      longitude: map.getBounds().getSouthWest().lng(),
    },
    categoryId: selectedCategory,
    limit: 200,
  });

  return (
    <MapView>
      {data?.providers.map(provider => (
        <Marker
          key={provider.id}
          position={provider.baseLocation}
          provider={provider}
        />
      ))}
    </MapView>
  );
}
```

**SQL Query:**

```sql
SELECT p.*
FROM provider_profiles p
WHERE p."locationGeom" && ST_MakeEnvelope(
  sw_lng, sw_lat,
  ne_lng, ne_lat,
  4326
);
```

---

### 3. Find Nearest Providers (`provider.findNearest`)

Get the N closest providers to a location (KNN search).

**Input Schema:**

```typescript
{
  latitude: number;
  longitude: number;
  categoryId?: string;
  limit?: number;  // Max 50, default 10
}
```

**Output:**

```typescript
{
  providers: Array<{
    id: string;
    userId: string;
    businessName: string | null;
    categoryId: string;
    baseLocation: { lat, lng, address };
    averageRating: number;
    reputationScore: number;
    distance: number;  // Distance in km
  }>;
  searchLocation: {
    latitude: number;
    longitude: number;
  };
}
```

**Example Usage:**

```typescript
// "Find providers near me" feature
function NearbyProviders() {
  const { latitude, longitude } = useCurrentLocation();

  const { data } = trpc.provider.findNearest.useQuery({
    latitude,
    longitude,
    categoryId: 'plumbing',
    limit: 5,
  });

  return (
    <List>
      {data?.providers.map(provider => (
        <ListItem>
          {provider.businessName} - {provider.distance} km away
        </ListItem>
      ))}
    </List>
  );
}
```

**SQL Query:**

```sql
-- Uses KNN operator <-> for fast nearest neighbor search
SELECT p.*, ST_Distance(...) AS distance_km
FROM provider_profiles p
WHERE p."isActive" = true
ORDER BY p."locationGeom" <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)
LIMIT 10;
```

---

### 4. Get Area Statistics (`provider.getAreaStats`)

Get statistics about provider distribution in an area.

**Input Schema:**

```typescript
{
  latitude: number;
  longitude: number;
  radiusKm: number;  // Max 100km, default 10km
}
```

**Output:**

```typescript
{
  area: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  stats: {
    totalProviders: number;
    averageRating: number;
    averageCompletedJobs: number;
    aadhaarVerifiedCount: number;
    backgroundVerifiedCount: number;
  };
  categoriesDistribution: Array<{
    categoryId: string;
    count: number;
  }>;
}
```

**Example Usage:**

```typescript
// Dashboard or analytics page
function AreaInsights() {
  const { data } = trpc.provider.getAreaStats.useQuery({
    latitude: 26.8467,
    longitude: 80.9462,
    radiusKm: 10,
  });

  return (
    <Card>
      <h2>Providers in your area</h2>
      <p>Total: {data?.stats.totalProviders}</p>
      <p>Avg Rating: {data?.stats.averageRating}/5</p>
      <p>Aadhaar Verified: {data?.stats.aadhaarVerifiedCount}</p>

      <h3>By Category</h3>
      {data?.categoriesDistribution.map(cat => (
        <div>{cat.categoryId}: {cat.count} providers</div>
      ))}
    </Card>
  );
}
```

---

## PostgreSQL Functions

The migration creates helper functions you can use directly:

### `find_providers_within_radius()`

```sql
SELECT * FROM find_providers_within_radius(
  26.8467,           -- latitude
  80.9462,           -- longitude
  5.0,               -- radius in km
  'clx123...',       -- category_filter (optional)
  4.0,               -- min_rating (optional)
  true,              -- aadhaar_verified_filter (optional)
  20                 -- result_limit
);
```

### `count_providers_within_radius()`

```sql
SELECT count_providers_within_radius(
  26.8467,           -- latitude
  80.9462,           -- longitude
  10.0,              -- radius in km
  'clx123...'        -- category_filter (optional)
);
```

---

## Performance Tips

### 1. Index Usage

Verify the GIST index is being used:

```sql
EXPLAIN ANALYZE
SELECT * FROM find_providers_within_radius(26.8467, 80.9462, 5.0);
```

Look for: `Index Scan using idx_provider_profiles_location_gist`

### 2. Distance Units

- PostGIS `ST_Distance` with `geography` returns meters
- Always divide by 1000 to get kilometers
- `ST_DWithin` expects meters, multiply radiusKm by 1000

### 3. SRID 4326

- Always use SRID 4326 (WGS 84) for lat/lng coordinates
- This is the standard for GPS coordinates

### 4. Query Optimization

- Use `ST_DWithin` for "within radius" queries (faster than `ST_Distance < radius`)
- Use KNN operator `<->` for "nearest N" queries
- Use `&&` for bounding box queries (map viewport)

---

## Migration from Legacy Search

**Old endpoint:** `search.providers`

```typescript
// ❌ Old: Client-side filtering
const { data } = trpc.search.providers.useQuery({
  location: { lat, lng, radiusKm },
  categoryId,
  // ...
});
```

**New endpoint:** `provider.searchByRadius`

```typescript
// ✅ New: PostGIS database-level filtering
const { data } = trpc.provider.searchByRadius.useQuery({
  latitude: lat,
  longitude: lng,
  radiusKm,
  categoryId,
  // ...
});
```

### Key Differences

| Feature | Legacy (`search.providers`) | PostGIS (`provider.searchByRadius`) |
|---------|----------------------------|-------------------------------------|
| **Performance** | O(n) client-side | O(log n) with GIST index |
| **Data Fetched** | 3x limit, filter in memory | Exactly limit, filter in DB |
| **Distance Calc** | Haversine formula (JS) | PostGIS `ST_Distance` (optimized C) |
| **Sorting** | In-memory after fetch | Database-level ORDER BY |
| **Index Support** | No spatial index | GIST spatial index |
| **Query Time (1M)** | 500-1000ms | <50ms |

---

## Troubleshooting

### Error: "PostGIS extension not installed"

```bash
psql $DATABASE_URL -c "CREATE EXTENSION postgis;"
```

### Error: "column locationGeom does not exist"

Run the migration:

```bash
psql $DATABASE_URL -f packages/database/prisma/migrations/0001_postgis_setup.sql
```

### Error: "No providers found" (but data exists)

Check if `location_geom` is populated:

```sql
SELECT COUNT(*) FROM provider_profiles WHERE "locationGeom" IS NULL;
```

If > 0, backfill:

```sql
UPDATE provider_profiles
SET "locationGeom" = ST_SetSRID(
  ST_MakePoint(
    ("baseLocation"::jsonb->>'lng')::float,
    ("baseLocation"::jsonb->>'lat')::float
  ),
  4326
)
WHERE "baseLocation" IS NOT NULL;
```

### Slow Queries

1. Verify index exists:
   ```sql
   \d provider_profiles
   ```

2. Check query plan:
   ```sql
   EXPLAIN ANALYZE <your query>;
   ```

3. Rebuild index if needed:
   ```sql
   REINDEX INDEX idx_provider_profiles_location_gist;
   ```

---

## Next Steps

1. **Deploy migration** to staging/production
2. **Update frontend** to use new `provider.searchByRadius` endpoint
3. **Monitor performance** with query logging
4. **A/B test** legacy vs PostGIS search
5. **Deprecate** `search.providers` after validation

---

## References

- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostGIS Performance Tips](https://postgis.net/workshops/postgis-intro/performance.html)
- [Prisma Raw Queries](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [tRPC Procedures](https://trpc.io/docs/server/procedures)

---

**Questions?** Check `/docs/database/README.md` for full database architecture documentation.
